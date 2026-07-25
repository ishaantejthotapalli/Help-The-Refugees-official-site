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
