import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import Splide from "@splidejs/splide";
import "@splidejs/splide/css";
import projectsData from "../../public/projects-data.json";
import projectTemplate from "../../public/project-template.html?raw";

import {
  capitalize,
  isSmallScreen,
  isPhone,
  checkCarouselOverflow,
  checkFormValidity,
  disableAnimation,
} from "./utils";

// Si un plugin GSAP doit être enregistré :
gsap.registerPlugin(ScrollToPlugin);

document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector("header");
  const projectsContainer = document.querySelector(
    ".projects-container-global"
  );
  const carouselArrows = document.querySelectorAll(".car-arrow");
  const mobileArrows = document.querySelectorAll(".mobile-carrow");
  const radiosCarousel = document.querySelectorAll(".radio-carousel");
  const phoneLink = document.getElementById("phone-info");
  const clientSlideTrack = document.querySelector(".client-slide-track");
  const infoMsgProjects = document.querySelector("#third-section .info-msg");

  const template = projectTemplate;

  let mainCarousels;
  let thumbCarouselImgContainer;
  let cards;
  let contactLinks;
  let projectsLinks;
  let secondLinks;

  let activeCard;
  let scrollingLinkAnimation = null;

  // Gestion du background
  const bgDiv = document.querySelector(".intro-bg");
  const img = document.getElementById("bg-image");

  initProjects()
  initMainBackground();

  // Versionning
  const spanVersionning = document.querySelector("span#versionning");
  if (spanVersionning) {
    spanVersionning.textContent = "v2";
  }

  // Call from Phone only
  if (!isPhone()) {
    phoneLink.style.setProperty("pointer-events", "none");
  }

  // INIT FUNCTIONS
  async function initProjects() {
    try {
      // Initialisation précoce des éléments statiques
      projectsLinks = document.querySelectorAll(".projects-link");
      secondLinks = document.querySelectorAll(".second-link");
      contactLinks = document.querySelectorAll(".contact-link");
      initScrollAnimation();
  
      // Chargement des données de projets
      const projectsData = await fetch("projects-data.json").then((response) =>
        response.json()
      );
  
      // Processus de chargement et de rendu des projets
      await processProjects(projectsData);
  
      // Fonction pour attendre le rendu complet
      function waitForDOMRender() {
        return new Promise((resolve) => {
          // Utiliser un micro-délai pour s'assurer du rendu complet
          setTimeout(() => {
            // Sélection à nouveau après le rendu
            mainCarousels = document.querySelectorAll(".main-carousel");
            thumbCarouselImgContainer = document.querySelectorAll(
              ".thumbnail-carousel .splide__list"
            );
            cards = document.querySelectorAll(".card");
            activeCard = document.querySelector(".card");
  
            // Vérification que les éléments sont bien présents
            if (mainCarousels.length > 0 && thumbCarouselImgContainer.length > 0) {
              resolve();
            } else {
              console.warn('Éléments du carousel non trouvés, nouvelle tentative');
              resolve(waitForDOMRender());
            }
          }, 100); // Délai court mais suffisant
        });
      }
  
      // Attendre le rendu complet
      await waitForDOMRender();
  
      // Initialisation finale dans une frame d'animation
      requestAnimationFrame(() => {
        // Ajouter la classe active au premier projet
        activeCard.classList.add("is-active");
  
        // Initialisation de Splide
        initSplide(projectsData);
  
        // Écouteurs d'événements pour les radios
        radiosCarousel.forEach((radio) => {
          radio.addEventListener("change", (event) => {
            activateCardForItem(radio);
          });
        });
  
        // Gestion de la taille d'écran
        handleScreenSize();
      });
  
    } catch (error) {
      console.error("Erreur lors de l'initialisation", error);
    }
  }

  function createProjectCardHTML(project, images) {
    let mainImagesHTML = "";
    images.forEach((image) => {
      mainImagesHTML += `
                        <li class="splide__slide">
                            <img src="${image}" alt="">
                        </li>`;
    });

    let thumbHTML = mainImagesHTML;
    let videmoMobile = "";

    if (project.gifs) {
      // Si cest sur mobile et spaceQuizz: Gif + images
      if (isSmallScreen() && project.id == 5) {
        
        project.gifs.forEach((gif) => {
          videmoMobile = `<img class='main-gif' src='${gif.src}' alt='SpaceQuizz gif'>`;
          thumbHTML = thumbHTML +
            `
                                <li class="splide__slide">
                                    <img src="${gif.thumb}" alt="">
                                </li>`;

          mainImagesHTML = mainImagesHTML +
            `
                                <li class="splide__slide">
                                    <img src="${gif.thumb}" alt="">
                                </li>`;

        });

      } else {
        console.log(isSmallScreen());
        
        if (project.id == 1 || project.id == 5) {
          project.gifs.forEach((gif) => {
            thumbHTML =
              `
                                  <li class="splide__slide">
                                      <img src="${gif.thumb}" alt="">
                                  </li>` + thumbHTML;
  
            mainImagesHTML =
              `
                                  <li class="splide__slide">
                                      <img src="${gif.src}" alt="">
                                  </li>` + mainImagesHTML;
          });
        } else {
          project.gifs.forEach((gif) => {
            thumbHTML += `
                                  <li class="splide__slide">
                                      <img src="${gif.thumb}" alt="">
                                  </li>`;
  
            mainImagesHTML += `
                                  <li class="splide__slide">
                                      <img src="${gif.src}" alt="">
                                  </li>`;
          });
        }
      }
    }

    if (project.video) {
      let liteYtElt = `<lite-youtube videoid="${project.video.src}" title="${project.video.title}" playlabel="${project.video.title}" js-api ></lite-youtube>`;
      if (!isSmallScreen()) {
        thumbHTML =
          `
                        <li class="splide__slide">
                        <img src="${project.video.thumb}" alt="">
                        </li>` + thumbHTML;

        mainImagesHTML =
          `
                        <li class="splide__slide">
                        ${liteYtElt}
                        </li>` + mainImagesHTML;
      } else {
        videmoMobile = liteYtElt;
      }
    }

    let infosProjectHTML = "";
    Object.entries(project.details).forEach(([key, value]) => {
      infosProjectHTML += `
                        <li class="infos-project">
                            <strong>${capitalize(key)}:</strong> ${value}
                        </li>`;
    });

    let cardHTML = template
      .replace(new RegExp("{{id}}", "g"), project.id)
      .replace(new RegExp("{{title}}", "g"), project.title.toUpperCase())
      .replace("{{description}}", project.description)
      .replace("{{thumbnails}}", thumbHTML)
      .replace("{{mainImages}}", mainImagesHTML)
      .replace("{{videoMobile}}", videmoMobile)
      .replace(new RegExp("{{infosProject}}", "g"), infosProjectHTML);
    return cardHTML;
  }

  async function processProjects(projectsData) {
    const imageLoadingPromises = [];

    projectsData.forEach((project) => {
      // Copie des images
      const images = [...project.images];

      // Sur mobile on vire les logos ils genent l'affichage et n'apportent rien
      if (isSmallScreen()) {
        if (project.id == 3 || project.id == 4) {
          images.shift();
        } else if (project.id == 2) {
          // Sur mobile on affiche en prio la version mobile
          const firstImage = images.shift();
          images.push(firstImage);
        }
      }

      // Préchargement des images du projet 1 (visible par défaut)
      if (project.id === 1) {
        // Préchargement prioritaire
        const preloadPromise = initImageLoading(images, project.id);
        imageLoadingPromises.push(preloadPromise);
      }

      // Création du HTML pour chaque projet
      const cardHTML = createProjectCardHTML(project, images);
      console.log(cardHTML);
      
      projectsContainer.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Attendre le préchargement des images du projet 1
    await Promise.all(imageLoadingPromises);
  }

  // Fonction pour importer dynamiquement les chemins d'images
  function importImageDynamically(imagePath) {
    return new URL(`./img/${imagePath}`, import.meta.url).href;
  }

  async function initImageLoading(images, projectId) {
    // Préchargement des images pour un projet spécifique
    const imageLoadPromises = images.map(
      (imagePath) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () =>
            resolve({
              status: "loaded",
              src: imagePath,
              projectId: projectId,
            });

          img.onerror = () =>
            resolve({
              status: "error",
              src: imagePath,
              projectId: projectId,
            });

          // Utiliser l'import dynamique pour résoudre le chemin
          img.src = importImageDynamically(imagePath);
        })
    );

    try {
      const imageResults = await Promise.allSettled(imageLoadPromises);

      // Analyser les résultats
      const loadedImages = imageResults.filter(
        (result) =>
          result.status === "fulfilled" && result.value.status === "loaded"
      );

      const failedImages = imageResults.filter(
        (result) =>
          result.status === "fulfilled" && result.value.status === "error"
      );

      return {
        totalImages: images.length,
        loadedImages: loadedImages.length,
        failedImages: failedImages.length,
        failedImageSources: failedImages.map((fail) => fail.value.src),
      };
    } catch (error) {
      console.error("Erreur lors du chargement des images", error);
      return null;
    }
  }

  function initMainBackground() {
    function setBackgroundImage() {
      bgDiv.style.backgroundImage = `url('${img.src}')`;
      img.remove();
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            console.log("entry : " + entry);
            if (entry.isIntersecting) {
              if (img.complete) {
                setBackgroundImage();
              } else {
                img.onload = setBackgroundImage;
              }
              observer.unobserve(bgDiv);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(bgDiv);
    } else {
      // Fallback pour les navigateurs qui ne supportent pas IntersectionObserver
      if (img.complete) {
        setBackgroundImage();
      } else {
        img.onload = setBackgroundImage;
      }
    }
  }

  function initScrollAnimation() {
    contactLinks.forEach((link) => {
      let duration = parseFloat(link.getAttribute("data-duration")) || 0.5;

      link.addEventListener("click", () => {
        let headerHeight = 0;
        if (header) headerHeight = header.clientHeight;
        scrollingLinkAnimation = gsap.to(window, {
          duration: duration,
          scrollTo: {
            y: "#contact-section",
            offsetY: headerHeight,
          },
          onComplete: () => {
            setTimeout(() => {
              scrollingLinkAnimation = null;
            }, 50);
          },
        });
      });
    });

    projectsLinks.forEach((link) => {
      let duration = parseFloat(link.getAttribute("data-duration")) || 0.5;

      link.addEventListener("click", () => {
        let seuil = isSmallScreen()
          ? "#third-section"
          : ".projects-container-global";
        let headerHeight = 0;
        if (header) headerHeight = header.clientHeight;
        scrollingLinkAnimation = gsap.to(window, {
          duration: duration,
          scrollTo: {
            y: seuil,
            offsetY: headerHeight,
          },
          onComplete: () => {
            setTimeout(() => {
              scrollingLinkAnimation = null;
            }, 50);
          },
        });
      });
    });

    secondLinks.forEach((link) => {
      let duration = parseFloat(link.getAttribute("data-duration")) || 0.5;

      link.addEventListener("click", () => {
        let headerHeight = 0;
        if (header) headerHeight = header.clientHeight;
        gsap.to(window, {
          duration: duration,
          scrollTo: { y: "#second-section", offsetY: headerHeight },
        });
        scrollingLinkAnimation = gsap.to(window, {
          duration: duration,
          scrollTo: {
            y: "#second-section",
            offsetY: headerHeight,
          },
          onComplete: () => {
            setTimeout(() => {
              scrollingLinkAnimation = null;
            }, 50);
          },
        });
      });
    });
  }

  function initSplide(data) {
    mainCarousels.forEach((mainCarousel, index) => {
      const startIndex = 0;

      var main = new Splide(`#main-carousel${index + 1}`, {
        autoHeight: true,
        type: "fade",
        rewind: true,
        pagination: false,
        arrows: false,
        drag: false,
        start: startIndex,
      });

      var thumbnails = new Splide(`#thumbnail-carousel${index + 1}`, {
        autoHeight: true,
        autoWidth: true,
        gap: 2,
        rewind: true,
        pagination: false,
        isNavigation: true,
        rewindByDrag: true,
        start: startIndex,
      });

      main.sync(thumbnails);
      main.mount();
      thumbnails.mount();
    });
  }

  async function pauseVideoPlayer() {
    const player = await document.querySelector("lite-youtube").getYTPlayer();
    if (player && player.getPlayerState() == 1) {
      player.pauseVideo();
    }
  }

  function handleScreenSize() {
    const initialWidth = window.innerWidth;
    const initialPortrait = window.innerHeight > initialWidth;
    let isPortrait = initialPortrait;
    initClientTrackSize();

    // Carousel Size
    adjustCarouselSize();

    // Carousel Arrows
    handleProjectsArrows();

    if (isSmallScreen()) {
      initCardSwipe();
    }

    window.addEventListener("orientationchange", checkOrientationChange);
    window.addEventListener("resize", checkOrientationChange);
    window.addEventListener("resize", checkCarouselArrows);

    function checkOrientationChange() {
      const newIsPortrait = window.innerHeight > window.innerWidth;
      if (
        newIsPortrait !== isPortrait ||
        (window.innerWidth <= 1024 && initialWidth > 1024)
      ) {
        isPortrait = newIsPortrait;
        console.log(
          "Orientation changée:",
          isPortrait ? "portrait" : "paysage"
        );

        adjustCarouselSize();
        refreshTrackSize();
        if (isPortrait || window.innerWidth <= 1024) {
          initCardSwipe();
          if (initialPortrait == false && initialWidth > 1024) {
            infoMsgProjects.classList.remove("gone");
          }
        } else {
          infoMsgProjects.classList.add("gone");
        }
      }
    }

    function checkCarouselArrows() {
      mainCarousels.forEach((mainCarousel) => {
        const thumbnailCarousel = mainCarousel.nextElementSibling;
        if (checkCarouselOverflow(thumbnailCarousel)) {
          adjustCarouselSize();
        }
      });
    }
  }

  // SCREEN SIZE DEPENDANT FUNCTIONS

  function initClientTrackSize() {
    clientSlideTrack.innerHTML += clientSlideTrack.innerHTML;
    const trackWidth = clientSlideTrack.scrollWidth;
    document.documentElement.style.setProperty(
      "--track-width",
      `${trackWidth / -2}px`
    );
  }

  function refreshTrackSize() {
    clientSlideTrack.style.transform = "translateX(0)";
    const newTrackWidth = clientSlideTrack.scrollWidth;
    document.documentElement.style.setProperty(
      "--track-width",
      `${newTrackWidth / -2}px`
    );
  }

  function handleProjectsArrows() {
    let hoveredCard = null;
    let hoveredArrow = null;

    if (!isSmallScreen()) {
      // Animation automatique des arrows
      carouselArrows[0].classList.add("animated");
      carouselArrows[1].classList.add("animated");

      // Liste des événements à écouter
      const eventsToDetect = ["click", "change", "touchstart"];

      // Ajout d'écouteurs d'événements au conteneur
      eventsToDetect.forEach((eventType) => {
        projectsContainer.addEventListener(eventType, (event) => {
          if (event.type !== "scroll") {
            disableAnimation(carouselArrows);
          }
        });
      });

      projectsContainer.addEventListener("mouseover", (event) => {
        const card = event.target.closest(".card");

        if (!card || activeCard == card) return;
        hoveredCard = card;

        switch (card.id) {
          case "project-1":
            if (activeCard && activeCard.id == "project-2") {
              hoveredArrow = carouselArrows[0];
            } else if (activeCard && activeCard.id == "project-5") {
              hoveredArrow = carouselArrows[1];
            }
            break;
          case "project-2":
            if (activeCard && activeCard.id == "project-3") {
              hoveredArrow = carouselArrows[0];
            } else if (activeCard && activeCard.id == "project-1") {
              hoveredArrow = carouselArrows[1];
            }
            break;
          case "project-3":
            if (activeCard && activeCard.id == "project-4") {
              hoveredArrow = carouselArrows[0];
            } else if (activeCard && activeCard.id == "project-2") {
              hoveredArrow = carouselArrows[1];
            }
            break;
          case "project-4":
            if (activeCard && activeCard.id == "project-5") {
              hoveredArrow = carouselArrows[0];
            } else if (activeCard && activeCard.id == "project-3") {
              hoveredArrow = carouselArrows[1];
            }
            break;
          case "project-5":
            if (activeCard && activeCard.id == "project-1") {
              hoveredArrow = carouselArrows[0];
            } else if (activeCard && activeCard.id == "project-4") {
              hoveredArrow = carouselArrows[1];
            }
            break;
        }
        if (hoveredArrow) {
          hoveredArrow.classList.add("hovered");
          hoveredCard.addEventListener("mouseleave", (event) => {
            hoveredArrow.classList.remove("hovered");
          });
        }
      });

      cards.forEach((card) => {
        card.addEventListener("mouseover", (event) => {
          switch (card.id) {
            case "project-1":
              if (activeCard.id == "project-2") {
                carouselArrows[0].classList.add("hovered");
              } else if (activeCard.id == "project-5") {
                carouselArrows[1].classList.add("hovered");
              }
          }
        });
      });

      window.removeEventListener("scroll", handleProjectsArrows);
    } else {
      window.addEventListener("scroll", mobileArrowsDisplay);

      function mobileArrowsDisplay() {
        // Mobile Carousel Arrows
        const topThreshold = window.innerHeight * 0.45;
        const bottomThreshold = window.innerHeight * 0.55;
        const sectionPosition = projectsContainer.getBoundingClientRect();
        if (
          sectionPosition.top < topThreshold &&
          sectionPosition.bottom > bottomThreshold
        ) {
          mobileArrows.forEach((arr) => {
            arr.style.opacity = "1";
          });
        } else {
          mobileArrows.forEach((arr) => {
            arr.style.opacity = "0";
          });
        }
      }
    }
  }

  function adjustCarouselSize() {
    // Thumbnails Overflow
    thumbCarouselImgContainer.forEach((cont) => {
      if (cont.clientWidth < cont.scrollWidth) {
        cont.classList.add("overflow");
      } else {
        cont.classList.remove("overflow");
      }

      //FIX FIrefox Li size
      let widthAdjusted = false;
      if (
        navigator.userAgent.indexOf("Firefox") > -1 ||
        (navigator.userAgent.indexOf("Safari") > -1 &&
          navigator.userAgent.indexOf("Chrome") === -1)
      ) {
        const items = cont.querySelectorAll("li");
        items.forEach((item) => {
          const img = item.querySelector("img");
          const imgWidth = img.clientWidth * 1.06;
          const contWidth = item.clientWidth;
          if (img && imgWidth < contWidth) {
            item.style.width = `${imgWidth}px`;
            widthAdjusted = true;
          }
        });
        if (widthAdjusted) {
          cont.parentElement.parentElement
            .querySelector(".splide__arrow--next")
            .click();
        }
      }
    });

    mainCarousels.forEach((mainCarousel) => {
      const activeImg = mainCarousel.querySelector(
        ".splide__slide:first-child img, .splide__slide:first-child lite-youtube"
      );
      const imgs = mainCarousel.querySelectorAll(".splide__slide img");

      if (activeImg) {
        const mainWidth = activeImg.clientWidth;

        const thumbnailCarousel = activeImg
          .closest(".splide-container")
          .querySelector(".thumbnail-carousel");

        if (thumbnailCarousel) {
          // On replace les fleches si splide_track moins large
          const insideCarouselArrows =
            thumbnailCarousel.querySelectorAll(".splide__arrow");
          if (
            mainWidth * 0.95 >
            thumbnailCarousel.querySelector(".splide__track").clientWidth
          ) {
            insideCarouselArrows[0].style.left = "0";
            insideCarouselArrows[1].style.right = "0";
          }
          thumbnailCarousel.style.setProperty(
            "width",
            `${mainWidth}px`,
            "important"
          );
        }

        imgs.forEach((img) => {
          // Ajustement de la hauteur
          const imgRatio = img.naturalHeight / img.naturalWidth;
          const imgRealHeight = imgRatio * img.clientWidth;

          // Calcul de la différence entre realHeight et renderedH
          const imgDifference = Math.abs(imgRealHeight - img.clientHeight);
          const imgTolerance = 0.01 * imgRealHeight; // 1%

          if (imgDifference >= imgTolerance) {
            img.style.setProperty(
              "height",
              `${Math.round(imgRealHeight)}px`,
              "important"
            );
          }
        });
      }
    });
  }

  function initCardSwipe() {
    // Idée: si swipe pas opti ajouter la durée du swipe à croiser avec la distance, le swipe doit être court
    let startX = 0;
    let startY = 0;
    let currentSlide = 1;

    const totalSlides = 5;

    const handleClickProjects = (e) => {
      const cardRect = activeCard.getBoundingClientRect();
      const clickX = e.clientX;

      if (clickX < cardRect.left) {
        previousSlide();
      } else if (clickX > cardRect.right) {
        nextSlide();
      }
    };

    const handleTouchStart = (e) => {
      if (!e.target.closest(".thumbnail-carousel")) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = null;
      }
    };

    const handleTouchEnd = (e) => {
      if (startX === null) return;

      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;

      const endY = e.changedTouches[0].clientY;
      const diffY = startY - endY;

      if (Math.abs(diffX) > 40 && Math.abs(diffY) < 25) {
        if (diffX > 0) {
          nextSlide();
        } else {
          previousSlide();
        }
      }
    };

    const nextSlide = () => {
      currentSlide = currentSlide || 1;
      if (currentSlide < totalSlides) {
        currentSlide++;
      } else {
        currentSlide = 1;
      }
      let activeItem = document.getElementById(`item-${currentSlide}`);
      console.log(activeItem);

      activeItem.checked = true;
      activateCardForItem(activeItem);
    };

    const previousSlide = () => {
      currentSlide = currentSlide || 1;

      if (currentSlide > 1) {
        currentSlide--;
      } else {
        currentSlide = totalSlides;
      }
      let activeItem = document.getElementById(`item-${currentSlide}`);
      activeItem.checked = true;
      activateCardForItem(activeItem);
    };

    projectsContainer.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    projectsContainer.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });
    projectsContainer.addEventListener("click", handleClickProjects);
  }

  function activateCardForItem(radioItem) {
    cards.forEach((label) => {
      label.classList.remove("is-active");
    });

    if (radioItem.checked) {
      pauseVideoPlayer();
      const correspondingCard = document.querySelector(
        `label[for="${radioItem.id}"]`
      );

      if (correspondingCard) {
        correspondingCard.classList.add("is-active");
        activeCard = correspondingCard;
      }
    }
  }
});
