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

const reveals = document.querySelectorAll(".reveal");

function revealSections(){

    const trigger = window.innerHeight * 0.85;

    reveals.forEach(section => {

        const top = section.getBoundingClientRect().top;

        if(top < trigger){

            section.classList.add("active");

        }

    });

}

window.addEventListener("scroll", revealSections);

window.addEventListener("load", revealSections);

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
