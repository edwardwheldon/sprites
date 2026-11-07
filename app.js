import { setupRobocopPage } from "./js/pages/robocop.js";
import { setupSpaceHarrierPage } from "./js/pages/space-harrier.js";
import { setupShadowWarriorsPage } from "./js/pages/shadow-warriors.js";

setupRobocopPage();
setupSpaceHarrierPage();
setupShadowWarriorsPage();

const stage = document.querySelector(".stage");
const gamePages = [...document.querySelectorAll(".game-page")];
const gameLinks = [...document.querySelectorAll(".game-link")];
const pageTitles = {
  robocop: "RoboCop — Animations",
  "space-harrier": "Space Harrier — Animations",
  "shadow-warriors": "Shadow Warriors — Animations",
};

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
  document.title = pageTitles[activePage.id];
}

window.addEventListener("hashchange", () => showGame(window.location.hash));
showGame(window.location.hash);
