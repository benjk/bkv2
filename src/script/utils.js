
import 'lite-youtube-embed';
import 'lite-youtube-embed/src/lite-yt-embed.css';

// Monkey patch de la méthode getYTPlayer
export let originalGetYTPlayer;
setTimeout(() => {
    const LiteYTEmbed = customElements.get('lite-youtube');
    if (LiteYTEmbed) {
      originalGetYTPlayer = LiteYTEmbed.prototype.getYTPlayer;
      
      LiteYTEmbed.prototype.getYTPlayer = async function() {
        if (!this.playerPromise) {
          this.playerPromise = new Promise((resolve) => {
            // Si le player existe déjà, résoudre immédiatement
            if (this.player) {
              resolve(this.player);
            } else {
              // Sinon, définir un callback pour résoudre quand le player sera prêt
              this.playerCallback = (player) => {
                resolve(player);
              };
            }
          });
        }
        return this.playerPromise;
      };
    }
  }, 500);


export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function isSmallScreen() {
    return window.innerWidth <= 1024 || window.innerHeight > window.innerWidth
}

export function isPhone() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function checkCarouselOverflow(container) {
    const tempElt = document.querySelector('#third-section h2');
    const marginM = parseFloat(getComputedStyle(tempElt).marginBottom);
    const parent = container.parentElement;

    const leftArrow = container.querySelector(".splide__arrow--prev");
    const rightArrow = container.querySelector(".splide__arrow--next");

    const leftThresh = leftArrow.getBoundingClientRect().left + marginM;
    const rightThresh = rightArrow.getBoundingClientRect().right + marginM;
    const containerRect = parent.getBoundingClientRect();
    
    return leftThresh < containerRect.left || rightThresh > containerRect.right;
}

let btn = document.querySelector(".submit-btn")
btn.addEventListener("click", checkFormValidity);
export function checkFormValidity() {
    const errorMsg = document.querySelector(".error-msg");
    const submitBtn = document.querySelector("#contact-section .submit-btn");
    const contactForm = document.getElementById("contact-form");    
    const contact = contactForm.querySelector("#contact");    
    const message = contactForm.querySelector("#message");

    errorMsg.style.opacity = 0;
    
    if(message.value.length == 0) {
        message.focus();
        displayContactError("Je crois que tu as oublié de mettre un message !")
    } else if (message.value.length < 20) {
        message.focus();
        displayContactError("Il va falloir m'en dire un peu plus...")
    } else if (contact.value.length == 0) {
        contact.focus();
        displayContactError("Renseigne ton contact si tu veux une réponse !")
    } else if (!validateContact(contact.value) ) {
        contact.focus();
        displayContactError("Il me faut un mail ou téléphone valide !")
    } else {
        submitForm()
    }
    
    function displayContactError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.opacity = 1;
    }
    
    function validateContact(contact) {
        const email = /\S+@\S+\.\S+/;
        const phone = /^\d{10}$/
        return email.test(contact) || phone.test(contact);
    }
    
    function submitForm() {
        errorMsg.classList.add('important');
        var formData = new FormData(contactForm);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", contactForm.action, true);
        xhr.send(formData);
        loadingButtonAnimation(submitBtn);
        xhr.onload = function(e) {
            if (xhr.status === 200) {
                displayContactError("Merci pour votre message ! Je l'ai bien reçu et le traite dans les plus brefs délais.");
                contactForm.reset()
            } else {
                displayContactError("Erreur serveur : contactez directement contact@benkielinski.Fr")
            }
            stopLoadingButtonAnimation(submitBtn)
        };
    }

    function loadingButtonAnimation(button) {
        button.classList.add('loading');
        var btnText = button.querySelector('span.btn-text');
        var spinner = button.querySelector('span.loader');
        btnText.style.visibility = "hidden"
        spinner.classList.remove('gone');
      }
      
      function stopLoadingButtonAnimation(button) {
        if (button != null) {
          button.classList.remove('loading');
          button.classList.add('disabled');
          var btnText = button.querySelector('span.btn-text');
          var spinner = button.querySelector('span.loader');
          btnText.style.visibility = "visible"
          spinner.classList.add('gone');
        }
      }
}

export function disableAnimation(elementTab) {
    elementTab.forEach( element => {
        element.classList.remove('animated');
    })
}
