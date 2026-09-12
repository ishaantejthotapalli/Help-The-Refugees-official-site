(() => {
    "use strict";

    const fallbackKnowledge = {
        quickQuestions: ["What is a refugee?", "How can students help?"],
        answers: [
        {
            terms: ["refugee", "meaning", "definition", "who"],
            text: "A refugee is someone who has left their country because returning would put them at serious risk from persecution, conflict or violence. Refugees are people with rights, skills, families and hopes—not just a label.",
            link: "/learn/what-is-a-refugee/",
            linkText: "Read: What is a refugee?"
        },
        {
            terms: ["asylum", "migrant", "difference", "terminology", "terms"],
            text: "A refugee has crossed a border and needs international protection. An asylum seeker is asking for that protection and waiting for a decision. A migrant may move for many reasons, and an internally displaced person has fled home without crossing an international border.",
            link: "/learn/refugee-migrant-asylum-seeker/",
            linkText: "Compare the important terms"
        },
        {
            terms: ["help", "action", "student", "donate", "volunteer", "support"],
            text: "Start close to home: learn from reliable sources, challenge one stereotype calmly, welcome newcomers without asking them to share painful experiences, and work with a trusted adult or registered organisation before collecting money or supplies.",
            link: "/learn/how-students-can-help/",
            linkText: "See respectful ways to help"
        },
        {
            terms: ["hardship", "challenge", "danger", "journey", "difficult"],
            text: "The hardship may begin before flight and continue after arrival. People can face unsafe journeys, family separation, interrupted education, uncertain paperwork, discrimination and isolation. Reaching a safe border is important, but belonging and rebuilding take time.",
            link: "/more-info/hardships/",
            linkText: "Explore hardships and solutions"
        },
        {
            terms: ["map", "country", "crisis", "where", "world", "displacement"],
            text: "Forced displacement happens across the world, and many people remain inside their own country. Our map introduces several major crises, but it is illustrative—not a live tracker or a complete picture of every journey.",
            link: "/more-info/world-crisis-map/",
            linkText: "Open the crisis map"
        },
        {
            terms: ["game", "play", "simulation", "safe passage"],
            text: "You can learn through the Refugee Journey decision game or the Safe Passage teamwork challenge. They are educational simulations, not recreations of any one person's real experience.",
            link: "/games/refugee-journey/",
            linkText: "Play Refugee Journey"
        },
        {
            terms: ["mental", "health", "trauma", "lonely", "belonging"],
            text: "Mental health can be affected by danger, separation, uncertain legal status, poor housing, racism and isolation. Community support, school, safety and access to services can help. It is important not to assume every refugee has the same experience.",
            link: "/more-info/hardships/",
            linkText: "Learn about challenges after arrival"
        },
        {
            terms: ["source", "fact", "reliable", "trust", "accurate"],
            text: "The website prioritises information from organisations such as UNHCR, UNICEF, WHO, UNESCO, IOM and IDMC. Always check a statistic's source, reporting period and publication date before sharing it."
        }
        ]
    };
    const knowledge = window.RefugeeAgentKnowledge || fallbackKnowledge;
    const answers = knowledge.answers;
    const quickQuestions = knowledge.quickQuestions;
    const siteIndex = window.RefugeeAgentSiteIndex || [];
    let lastAnswer = null;

    const stopWords = new Set(["a", "an", "and", "are", "can", "do", "does", "for", "from", "how", "i", "in", "is", "it", "me", "of", "on", "or", "the", "this", "to", "what", "when", "where", "who", "why", "with", "you"]);

    function chooseSiteAnswer(normalised) {
        const queryTerms = normalised.split(" ").filter(word => word.length > 2 && !stopWords.has(word));
        let best = null;
        let bestScore = -1;

        siteIndex.forEach(page => {
            page.chunks.forEach(chunk => {
                const searchable = `${page.title} ${chunk}`.toLowerCase();
                const score = queryTerms.reduce((total, term) => {
                    const matches = searchable.split(term).length - 1;
                    return total + Math.min(matches, 3);
                }, 0) + (normalised.includes(page.title.toLowerCase()) ? 4 : 0);

                if (score > bestScore) {
                    bestScore = score;
                    best = { page, chunk };
                }
            });
        });

        if (!best) {
            return {
                text: "I can guide you through everything published on Help The Refugees: definitions, hardships, displacement crises, games, videos, events, sources and respectful ways to act. Ask about any part of the website and I’ll explain it.",
                link: "/learn/",
                linkText: "Explore all learning topics"
            };
        }

        return {
            text: best.chunk,
            simple: best.chunk,
            link: best.page.url,
            linkText: `Read more on ${best.page.title}`
        };
    }

    function chooseAnswer(question) {
        const normalised = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

        if (/^(?:explain|say|make).*(?:simple|simpler)|(?:i do not|i don't|dont) understand|confus/.test(normalised) && lastAnswer) {
            return { ...lastAnswer, text: lastAnswer.simple || lastAnswer.text, linkText: lastAnswer.linkText || "Learn more" };
        }

        let best = null;
        let bestScore = 0;

        answers.forEach(answer => {
            const score = answer.terms.reduce((total, term) => total + (normalised.includes(term) ? term.split(" ").length : 0), 0);
            if (score > bestScore) {
                best = answer;
                bestScore = score;
            }
        });

        const result = best || chooseSiteAnswer(normalised);
        lastAnswer = result;
        return result;
    }

    function createAgent() {
        if (document.getElementById("refugee-agent")) return;

        const wrapper = document.createElement("aside");
        wrapper.id = "refugee-agent";
        wrapper.className = "refugee-agent";
        wrapper.setAttribute("aria-label", "Help The Refugees learning assistant");
        wrapper.innerHTML = `
            <button class="refugee-agent__launcher" type="button" aria-label="Open learning assistant" aria-expanded="false" aria-controls="refugee-agent-panel">
                <span class="refugee-agent__logo" aria-hidden="true"></span>
                <span class="refugee-agent__status" aria-hidden="true"></span>
                <span class="refugee-agent__hint">Ask about refugees</span>
            </button>
            <section class="refugee-agent__panel" id="refugee-agent-panel" aria-hidden="true">
                <header class="refugee-agent__header">
                    <span class="refugee-agent__logo" role="img" aria-label="Help The Refugees"></span>
                    <div><strong>Refugee Learning Guide</strong><span><i aria-hidden="true"></i> Ready to help</span></div>
                    <button class="refugee-agent__close" type="button" aria-label="Close learning assistant">×</button>
                </header>
                <div class="refugee-agent__messages" role="log" aria-live="polite" aria-relevant="additions">
                    <div class="refugee-agent__message refugee-agent__message--bot">Hi there! 👋 I can help you understand refugees, important terms, global crises and respectful ways to take action.</div>
                </div>
                <div class="refugee-agent__quick" aria-label="Suggested questions"></div>
                <form class="refugee-agent__form">
                    <label class="sr-only" for="refugee-agent-input">Ask a question</label>
                    <input id="refugee-agent-input" type="text" maxlength="240" autocomplete="off" placeholder="Ask me something…">
                    <button type="submit" aria-label="Send question">➤</button>
                </form>
                <p class="refugee-agent__note">Educational guidance from this website—not emergency or legal advice.</p>
            </section>`;
        document.body.appendChild(wrapper);

        const launcher = wrapper.querySelector(".refugee-agent__launcher");
        const panel = wrapper.querySelector(".refugee-agent__panel");
        const close = wrapper.querySelector(".refugee-agent__close");
        const form = wrapper.querySelector(".refugee-agent__form");
        const input = wrapper.querySelector("input");
        const messages = wrapper.querySelector(".refugee-agent__messages");
        const quick = wrapper.querySelector(".refugee-agent__quick");

        const setOpen = open => {
            wrapper.classList.toggle("is-open", open);
            launcher.setAttribute("aria-expanded", String(open));
            launcher.setAttribute("aria-label", open ? "Close learning assistant" : "Open learning assistant");
            panel.setAttribute("aria-hidden", String(!open));
            if (open) window.setTimeout(() => input.focus(), 240);
        };

        const addMessage = (text, type, answer) => {
            const message = document.createElement("div");
            message.className = `refugee-agent__message refugee-agent__message--${type}`;
            message.textContent = text;
            if (answer && answer.link) {
                const link = document.createElement("a");
                link.href = answer.link;
                link.textContent = answer.linkText;
                message.appendChild(link);
            }
            messages.appendChild(message);
            messages.scrollTop = messages.scrollHeight;
        };

        const respond = question => {
            addMessage(question, "user");
            input.value = "";
            const typing = document.createElement("div");
            typing.className = "refugee-agent__typing";
            typing.setAttribute("aria-label", "Assistant is typing");
            typing.innerHTML = "<span></span><span></span><span></span>";
            messages.appendChild(typing);
            messages.scrollTop = messages.scrollHeight;
            window.setTimeout(() => {
                typing.remove();
                const answer = chooseAnswer(question);
                addMessage(answer.text, "bot", answer);
            }, 550);
        };

        quickQuestions.forEach(question => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = question;
            button.addEventListener("click", () => respond(question));
            quick.appendChild(button);
        });

        launcher.addEventListener("click", () => setOpen(!wrapper.classList.contains("is-open")));
        close.addEventListener("click", () => setOpen(false));
        form.addEventListener("submit", event => {
            event.preventDefault();
            const question = input.value.trim();
            if (question) respond(question);
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && wrapper.classList.contains("is-open")) {
                setOpen(false);
                launcher.focus();
            }
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", createAgent);
    else createAgent();
})();
