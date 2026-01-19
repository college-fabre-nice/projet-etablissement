// app.v2.js
// Version propre : pas d'impression, modale fonctionnelle, chargement JSON

const AXES_CONFIG = [
    { id: "axe1", file: "data/axe1.json" },
    { id: "axe2", file: "data/axe2.json" },
    { id: "axe3", file: "data/axe3.json" }
];

const axesData = {}; // stockage des données chargées

console.log("app.v2.js chargé"); // pour vérifier dans la console

// ---------- Utilitaires DOM ----------

function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

// ---------- Chargement des JSON ----------

async function loadAxes() {
    const promises = AXES_CONFIG.map(async (cfg, index) => {
        try {
            const res = await fetch(cfg.file);
            if (!res.ok) {
                console.error("Erreur de chargement pour", cfg.file, res.status);
                return;
            }
            const data = await res.json();
            if (!data.id) data.id = cfg.id;
            data._axisNumber = index + 1;
            axesData[cfg.id] = data;
        } catch (err) {
            console.error("Erreur réseau pour", cfg.file, err);
        }
    });

    await Promise.all(promises);
}

// ---------- Construction des onglets ----------

function buildTabs() {
    const tabsContainer = document.getElementById("tabs");
    if (!tabsContainer) return;

    tabsContainer.innerHTML = "";

    AXES_CONFIG.forEach((cfg, index) => {
        const data = axesData[cfg.id];
        if (!data) return;

        const axisNumber = index + 1;

        const tabLabel =
            data.shortTitle ||
            data.tabTitle ||
            data.title ||
            `Axe ${axisNumber}`;

        const btn = document.createElement("button");
        btn.className = "tab-btn";
        btn.type = "button";
        btn.dataset.axis = cfg.id;
        btn.textContent = tabLabel;

        if (index === 0) {
            btn.classList.add("active");
        }

        btn.addEventListener("click", () => {
            setActiveAxis(cfg.id);
        });

        tabsContainer.appendChild(btn);
    });
}

// ---------- Construction du contenu des axes ----------

function buildAxesContent(openModalFn) {
    const container = document.getElementById("axes-container");
    if (!container) return;

    container.innerHTML = "";

    AXES_CONFIG.forEach((cfg, index) => {
        const axis = axesData[cfg.id];
        if (!axis) return;

        const axisSection = createEl("section", "tab-content");
        axisSection.id = cfg.id;
        if (index === 0) {
            axisSection.classList.add("active");
        }

        // Titre de l’axe
        const axisTitle = createEl("h2", "axis-title", axis.title || `Axe ${index + 1}`);
        axisSection.appendChild(axisTitle);

        // Sous-titre éventuel
        if (axis.subtitle) {
            const axisSubtitle = createEl("p", "axis-subtitle", axis.subtitle);
            axisSection.appendChild(axisSubtitle);
        }

        // Grille d’objectifs
        const columns = createEl("div", "columns");

        (axis.objectives || []).forEach((obj) => {
            const objectiveCol = createEl("div", "objective");

            // Bulle d’objectif
            const objectiveTitle = createEl("div", "objective-title", obj.title || "");
            objectiveCol.appendChild(objectiveTitle);

            // Liste des actions
            const actionsWrap = createEl("div", "actions");

            (obj.actions || []).forEach((action) => {
                const bubble = createEl(
                    "div",
                    "action-bubble",
                    action.title || ""
                );

                // Ouverture de la modale
                bubble.addEventListener("click", () => {
                    openModalFn(obj, action, axis);
                });

                actionsWrap.appendChild(bubble);
            });

            objectiveCol.appendChild(actionsWrap);
            columns.appendChild(objectiveCol);
        });

        axisSection.appendChild(columns);

        const hint = createEl(
            "p",
            "hint",
            "Cliquez sur une bulle pour afficher le détail de l’action dans une fenêtre contextuelle."
        );
        axisSection.appendChild(hint);

        container.appendChild(axisSection);
    });
}

// ---------- Activation d’un axe ----------

function setActiveAxis(axisId) {
    const allTabs = document.querySelectorAll(".tab-btn");
    allTabs.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.axis === axisId);
    });

    const allContents = document.querySelectorAll(".tab-content");
    allContents.forEach((section) => {
        section.classList.toggle("active", section.id === axisId);
    });
}

// ---------- Initialisation complète ----------

document.addEventListener("DOMContentLoaded", async () => {
    await loadAxes();
    buildTabs();

    // Récupération des éléments de la modale
    const modalBackdrop = document.getElementById("modal-backdrop");
    const modalTitleEl = document.getElementById("modal-title");
    const modalBodyEl = document.getElementById("modal-body");
    const modalCloseBtn = document.getElementById("modal-close");

    function closeModal() {
        if (!modalBackdrop) return;
        modalBackdrop.classList.remove("visible");
    }

    function openModal(objective, action, axis) {
        if (!modalBackdrop || !modalTitleEl || !modalBodyEl) return;

        // Titre = titre de l’action
        modalTitleEl.textContent = action.title || "";

        // Contenu = détails de l’action
        modalBodyEl.innerHTML = "";

        if (Array.isArray(action.details)) {
            const ul = document.createElement("ul");
            action.details.forEach((item) => {
                const li = document.createElement("li");
                li.textContent = item;
                ul.appendChild(li);
            });
            modalBodyEl.appendChild(ul);
        } else if (typeof action.details === "string") {
            const p = document.createElement("p");
            p.textContent = action.details;
            modalBodyEl.appendChild(p);
        } else {
            const p = document.createElement("p");
            p.textContent = "Aucun détail supplémentaire n’a été renseigné pour cette action.";
            modalBodyEl.appendChild(p);
        }

        modalBackdrop.classList.add("visible");
    }

    // Fermeture de la modale
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", closeModal);
    }
    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) {
                closeModal();
            }
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalBackdrop && modalBackdrop.classList.contains("visible")) {
            closeModal();
        }
    });

    // Construire le contenu des axes avec la fonction openModal définie ci-dessus
    buildAxesContent(openModal);
});
