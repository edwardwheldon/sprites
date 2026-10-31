import { setupRobocopPage } from "./js/pages/robocop.js";
import { setupSpaceHarrierPage } from "./js/pages/space-harrier.js";

setupRobocopPage();
setupSpaceHarrierPage();

const stage = document.querySelector(".stage");
const gamePages = [...document.querySelectorAll(".game-page")];
const gameLinks = [...document.querySelectorAll(".game-link")];

function showGame(hash) {
  const activePage =
    gamePages.find((page) => `#${page.id}` === hash) ?? gamePages[0];

  gamePages.forEach((page) => {
    page.hidden = page !== activePage;
  });
  gameLinks.forEach((link) => {
    if (link.hash === `#${activePage.id}`) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  stage.dataset.game = activePage.id;
  document.title =
    activePage.id === "space-harrier"
      ? "Space Harrier — Animations"
      : "RoboCop — Animations";
}

window.addEventListener("hashchange", () => showGame(window.location.hash));
showGame(window.location.hash);
