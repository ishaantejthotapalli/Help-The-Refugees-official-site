/* ==========================================
   HELP THE REFUGEES
   Main JavaScript
========================================== */

/* ===========================
   Scroll Progress Bar
=========================== */

const progressBar = document.getElementById("progress-bar");

window.addEventListener("scroll", () => {

    const scrollTop = document.documentElement.scrollTop;

    const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

    const progress = (scrollTop / scrollHeight) * 100;

    progressBar.style.width = progress + "%";

});

/* ===========================
   Reveal on Scroll
=========================== */

/* ===========================
   Reveal on Scroll
=========================== */

const reveals = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("active");

            revealObserver.unobserve(entry.target);

        }

    });

}, {
    threshold: 0.15,
    rootMargin: "0px 0px -80px 0px"
});

reveals.forEach(reveal => {

    revealObserver.observe(reveal);

});

/* ===========================
   Mobile Navigation
=========================== */

const menuButton = document.querySelector(".menu-toggle");

const navLinks = document.querySelector(".nav-links");

if(menuButton){

    menuButton.addEventListener("click", () => {

        navLinks.classList.toggle("show");

    });

}

/* ===========================
   Mobile Dropdown Menus
=========================== */

document.querySelectorAll(".dropdown > a").forEach(dropdown => {

    dropdown.addEventListener("click", function(e){

        if(window.innerWidth <= 768){

            e.preventDefault();

            this.parentElement.classList.toggle("open");

        }

    });

});
/* ===========================
   Active Navigation Link
=========================== */

const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".nav-links a").forEach(link => {

    const href = link.getAttribute("href");

    if(href && href.endsWith(currentPage)){

        document
            .querySelectorAll(".nav-links a")
            .forEach(item => item.classList.remove("active"));

        link.classList.add("active");

    }

});

/* ===========================
   Back To Top Button
=========================== */

const topButton = document.createElement("button");

topButton.innerHTML = "↑";

topButton.id = "topButton";

document.body.appendChild(topButton);

Object.assign(topButton.style,{

    position:"fixed",
    bottom:"30px",
    right:"30px",
    width:"55px",
    height:"55px",
    border:"none",
    borderRadius:"50%",
    background:"#27ae60",
    color:"white",
    fontSize:"24px",
    cursor:"pointer",
    display:"none",
    boxShadow:"0 10px 25px rgba(0,0,0,.25)",
    transition:".3s",
    zIndex:"999"

});

window.addEventListener("scroll",()=>{

    if(window.scrollY>500){

        topButton.style.display="block";

    }else{

        topButton.style.display="none";

    }

});

topButton.addEventListener("mouseenter",()=>{

    topButton.style.transform="translateY(-5px) scale(1.08)";

});

topButton.addEventListener("mouseleave",()=>{

    topButton.style.transform="translateY(0) scale(1)";

});

topButton.addEventListener("click",()=>{

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});

/* ===========================
   Fade Page In
=========================== */

window.addEventListener("load",()=>{

    document.body.style.opacity="1";

});

/* ===========================
   Console Welcome Message
=========================== */

console.log(
"%c🌍 Welcome to Help The Refugees!",
"color:#27ae60;font-size:18px;font-weight:bold;"
);

console.log(
"%cCreated by Ishaan & Bramhha",
"color:#1b5e20;font-size:14px;"
);
/* ================= Live Educational Data ================= */

function formatDate(value) {
    if (!value) return "date not supplied";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "date not supplied"
        : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function animateNumber(element, target, formatter = value => value.toLocaleString()) {
    if (!element || !Number.isFinite(target)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : 900;
    const started = performance.now();

    function frame(now) {
        const progress = duration === 0 ? 1 : Math.min((now - started) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = formatter(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

async function loadNews() {
    const list = document.getElementById("news-list");
    const status = document.getElementById("news-status");
    if (!list) return;

    try {
        const response = await fetch(`news.json?v=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`News request failed with ${response.status}`);
        const data = await response.json();
        const articles = Array.isArray(data.articles) ? data.articles : [];
        if (!articles.length) throw new Error("No stories are available yet");

        list.replaceChildren(...articles.slice(0, 5).map(article => {
            const card = document.createElement("article");
            card.className = "resource-card news-card";

            if (article.image) {
                const image = document.createElement("img");
                image.src = article.image;
                image.alt = "";
                image.loading = "lazy";
                image.referrerPolicy = "no-referrer";
                card.appendChild(image);
            }

            const heading = document.createElement("h3");
            heading.textContent = article.title;
            card.appendChild(heading);

            const summary = document.createElement("p");
            summary.textContent = article.summary || "Open this story to learn more.";
            card.appendChild(summary);

            const meta = document.createElement("p");
            meta.className = "news-meta";
            meta.textContent = `${article.source || "News source"} · ${formatDate(article.published)}`;
            card.appendChild(meta);

            const link = document.createElement("a");
            link.className = "card-button";
            link.href = article.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Read and learn →";
            card.appendChild(link);
            return card;
        }));

        if (status) status.textContent = `Stories last checked ${formatDate(data.lastUpdated)}.`;
    } catch (error) {
        list.innerHTML = '<div class="resource-card news-placeholder"><h3>Our news helper is taking a break</h3><p>Please check back soon. The last good stories will return automatically.</p></div>';
        if (status) status.textContent = "News is temporarily unavailable.";
        console.error(error);
    }
}

async function loadStatistics() {
    const total = document.getElementById("displaced-count");
    const children = document.getElementById("children-count");
    const status = document.getElementById("statistics-status");
    if (!total || !children) return;

    try {
        const response = await fetch(`statistics.json?v=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Statistics request failed with ${response.status}`);
        const data = await response.json();
        if (!Number.isFinite(data.totalForciblyDisplaced)) throw new Error("Statistics have not loaded yet");

        animateNumber(total, data.totalForciblyDisplaced, value =>
            new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value));

        if (Number.isFinite(data.childrenPercentage)) {
            animateNumber(children, data.childrenPercentage);
        } else {
            children.textContent = "—";
            const suffix = document.getElementById("children-suffix");
            if (suffix) suffix.textContent = "";
        }

        if (status) {
            status.textContent = `UNHCR reporting year ${data.reportingYear}. Data checked ${formatDate(data.checkedAt)}.`;
        }
    } catch (error) {
        total.textContent = "—";
        children.textContent = "—";
        if (status) status.textContent = "The latest UNHCR numbers are being prepared. Please check back soon.";
        console.error(error);
    }
}

loadNews();
loadStatistics();
