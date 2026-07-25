const fs = require("fs");

const API_ROOT = "https://api.unhcr.org/population/v1";
const OUTPUT_FILE = "statistics.json";

function itemsFrom(payload) {
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
}

function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function get(path) {
    const response = await fetch(`${API_ROOT}/${path}`, {
        headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`UNHCR API returned ${response.status} for ${path}`);
    return response.json();
}

function sumFields(items, fields) {
    return items.reduce((total, item) =>
        total + fields.reduce((rowTotal, field) => rowTotal + number(item[field]), 0), 0);
}

function latestPopulatedRow(payload, fields) {
    const rows = itemsFrom(payload)
        .filter(item => sumFields([item], fields) > 0)
        .sort((a, b) => number(b.year) - number(a.year));
    if (!rows.length) throw new Error("UNHCR API returned no populated reporting rows.");
    return rows[0];
}

async function updateStatistics() {
    const [populationPayload, unrwaPayload, idmcPayload, demographicsPayload] = await Promise.all([
        get("population/?yearFrom=2020&yearTo=2099&limit=100"),
        get("unrwa/?yearFrom=2020&yearTo=2099&limit=100"),
        get("idmc/?yearFrom=2020&yearTo=2099&limit=100"),
        get("demographics/?yearFrom=2020&yearTo=2099&limit=100&columns[]=refugees&columns[]=oip")
    ]);

    const population = latestPopulatedRow(populationPayload, ["refugees", "asylum_seekers", "oip"]);
    const unrwaRow = latestPopulatedRow(unrwaPayload, ["total"]);
    const idmcRow = latestPopulatedRow(idmcPayload, ["total"]);
    const refugeesAndOthers = sumFields([population], ["refugees", "asylum_seekers", "oip"]);
    const unrwa = number(unrwaRow.total);
    const idps = number(idmcRow.total);
    const totalForciblyDisplaced = Math.round(refugeesAndOthers + unrwa + idps);

    const childFields = ["f_0_4", "m_0_4", "f_5_11", "m_5_11", "f_12_17", "m_12_17"];
    const knownAgeFields = [...childFields, "f_18_59", "m_18_59", "f_60", "m_60"];
    const demographics = latestPopulatedRow(demographicsPayload, knownAgeFields);
    const children = sumFields([demographics], childFields);
    const knownAgePopulation = sumFields([demographics], knownAgeFields);
    const childrenPercentage = knownAgePopulation > 0
        ? Math.round((children / knownAgePopulation) * 100)
        : null;

    if (totalForciblyDisplaced <= 0) {
        throw new Error("Calculated displacement total was empty; preserving previous data.");
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
        checkedAt: new Date().toISOString(),
        reportingYear: number(population.year),
        reportingYears: {
            population: number(population.year),
            unrwa: number(unrwaRow.year),
            idmc: number(idmcRow.year),
            demographics: number(demographics.year)
        },
        totalForciblyDisplaced,
        childrenPercentage,
        source: "UNHCR Refugee Data Finder",
        sourceUrl: "https://www.unhcr.org/refugee-statistics/"
    }, null, 2) + "\n");

    console.log(`Updated ${OUTPUT_FILE} using the latest available UNHCR datasets.`);
}

updateStatistics().catch(error => {
    console.error(error.message);
    process.exit(1);
});
