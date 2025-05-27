document.addEventListener('DOMContentLoaded', function () {
  // Initialisation de l'application

  initApplication();
  setupTabs();
  setupModelSelection();
  setupDataAugmentationMethods();
  setupDropdowns();
  setupSliders();
  setupValidationMethods();
  setupDataAugmentationMethods();
  const urlParams = new URLSearchParams(window.location.search);
  const useCaseId = urlParams.get('use_case_id');

  if (!useCaseId) {
    console.error("ID du cas d'utilisation manquant dans l'URL");
    // Vous pouvez rediriger vers une page d'erreur ou afficher un message plus user-friendly
    return;
  }
  // Initialiser la popup comme ouverte par défaut
  const popup = document.getElementById('experiment-popup');
  if (popup) {
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
});
// Variable globale pour stocker les features sélectionnées
let selectedFeatures = {};

function linkFeaturesWithDimensions() {
  // Écouter les changements dans l'onglet Features
  document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const featureName = this.dataset.feature;
      const row = this.closest('tr');
      const featureType = row.querySelector('td:nth-child(4)').textContent;

      if (this.checked) {
        // Ajouter la feature avec ses paramètres
        selectedFeatures[featureName] = {
          type: featureType,
          imputation: row.querySelector('.imputation-select').value,
          transformer: row.querySelector('.transformer-select').value
        };
      } else {
        // Supprimer la feature
        delete selectedFeatures[featureName];
      }

      // Mettre à jour les options de dimension reduction

    });
  });
}
// Ajouter ces fonctions pour gérer la popup
function openPopup() {
  const popup = document.getElementById('experiment-popup');
  popup.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Réinitialiser l'onglet actif
  switchTab('features');

  // Charger les données si nécessaire
  const urlParams = new URLSearchParams(window.location.search);
  const useCaseId = urlParams.get('use_case_id');
  const filename = document.querySelector('.dataset-info')?.dataset?.filename;

  if (filename) {
    loadDatasetColumns(filename);
  }

  if (useCaseId) {
    loadUseCaseData(useCaseId);
  }
}

// Définir les fonctions manquantes
function closePopup() {
  const popup = document.getElementById('experiment-popup');
  popup.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function switchTab(tabId) {
  // Mettre à jour les boutons
  document.querySelectorAll('.sliding-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });

  // Mettre à jour le contenu
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabId}-content`);
  });

}

// Initialiser après le chargement du DOM
document.addEventListener('DOMContentLoaded', function () {
  // Initialiser Feather Icons
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // Gestionnaire d'événements pour les onglets
  document.querySelectorAll('.sliding-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });
});

// Fonction pour lier les switches avec les features
function setupFeatureSwitches() {
  // Activer/désactiver les switches en fonction des features sélectionnées
  document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const anySelected = document.querySelectorAll('.feature-checkbox:checked').length > 0;
      document.querySelectorAll('.feature-selection-switch').forEach(sw => {
        sw.disabled = !anySelected;
        if (!anySelected) sw.checked = false;
      });
    });
  });



  // Initial state
  const anySelected = document.querySelectorAll('.feature-checkbox:checked').length > 0;
  document.querySelectorAll('.feature-selection-switch').forEach(sw => {
    sw.disabled = !anySelected;
  });
}



// Modifier initApplication pour gérer la popup
function initApplication() {
  // Initialiser Feather Icons une seule fois
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // Récupérer les paramètres URL
  const urlParams = new URLSearchParams(window.location.search);
  const useCaseId = urlParams.get('use_case_id');
  const isPopup = urlParams.get('popup') === 'true';

  // Récupérer le nom de fichier
  const datasetInfo = document.querySelector('.dataset-info');
  const filename = datasetInfo ? datasetInfo.dataset.filename : null;

  // Vérifier les paramètres requis
  if (!useCaseId) {
    console.error("ID du cas d'utilisation manquant dans l'URL");
    showError("Veuillez sélectionner un cas d'utilisation valide");
    return;
  }

  if (!filename) {
    console.error("Nom de fichier non disponible");
    showError("Aucun dataset n'est associé à ce cas d'utilisation");
    return;
  }

  // Initialiser les composants UI de base
  setupTabs();
  setupModelSelection();
  setupDataAugmentationMethods();
  setupDropdowns();
  setupSliders();
  setupValidationMethods();

  // Charger les données
  loadDatasetColumns(filename);


  // Configurer les interactions
  setupFeatureInteractions();
  setupFeatureSwitches();
  setupModelSelection();
  setupPopupInteractions(isPopup);

  // Activer le premier onglet
  switchTab('features');
  // Relier Features et Dimension Reduction
  linkFeaturesWithDimensions();

  // Initialiser l'état des options

  resetDimensionSettings();
}


function resetDimensionSettings() {
  // Réinitialiser les paramètres
  document.querySelectorAll('.feature-selection-switch').forEach(switchEl => {
    switchEl.checked = false;
  });

  document.getElementById('pca-enable').checked = false;

  // Mettre à jour l'interface

}
function setupFeatureInteractions() {
  // Gestion des cases à cocher
  document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {

      const feature = this.dataset.feature;
      const row = this.closest('tr');

      if (this.checked) {
        selectedFeatures[feature] = {
          imputation: row.querySelector('.imputation-select').value,
          transformer: row.querySelector('.transformer-select').value
        };
      } else {
        delete selectedFeatures[feature];
      }
    });
  });

  // Bouton "Select All"
  document.getElementById('select-all-features-btn')?.addEventListener('click', function () {
    const checkboxes = document.querySelectorAll('.feature-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => {
      cb.checked = !allChecked;
      cb.dispatchEvent(new Event('change'));
    });
  });
}




function loadDatasetColumns(filename) {
  console.log("Chargement des colonnes pour le fichier:", filename);

  fetch(`/entrainement/get_dataset_columns/${filename}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP! statut: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Données reçues:", data);
      if (data.error) {
        showError('Erreur lors du chargement des colonnes: ' + data.error);
        return;
      }
      updateFeatureTable(data.columns, data.dtypes);
    })
    .catch(error => {
      console.error('Erreur:', error);
      showError('Échec du chargement des colonnes du dataset');
    });
}

function updateFeatureTable(columns, dtypes) {
  const tbody = document.querySelector('.feature-table tbody');
  tbody.innerHTML = ''; // Vider le tableau

  columns.forEach((column, index) => {
    const type = dtypes[column] || 'Unknown';
    const meaning = getMeaningFromType(type);

    const row = document.createElement('tr');
    row.innerHTML = `
            <td><input type="checkbox" class="feature-checkbox" data-feature="${column}"></td>
            <td>${column}</td>
            <td>
                <label class="switch">
                    <input type="checkbox" class="status-toggle" checked>
                    <span class="slider"></span>
                </label>
            </td>
            <td>${type}</td>
            <td class="meaning-cell">${meaning}</td>
            <td>
                <select class="imputation-select">
                    ${getImputationOptions(type)}
                </select>
            </td>
            <td>
                <select class="transformer-select">
                    ${getTransformerOptions(type)}
                </select>
            </td>
        `;
    tbody.appendChild(row);
  });


}


function getMeaningFromType(type) {
  if (type.includes('int') || type.includes('float')) {
    return 'Numerical';
  } else if (type.includes('object') || type.includes('string')) {
    return 'Categorical';
  } else if (type.includes('bool')) {
    return 'Boolean';
  } else if (type.includes('datetime')) {
    return 'Date';
  }
  return 'Other';
}

function getImputationOptions(type) {
  if (type.includes('int') || type.includes('float')) {
    return `
            <option value="drop">Drop rows</option>
            <option value="mean" selected>Mean</option>
            <option value="median">Median</option>
            <option value="zero">Replace with 0</option>
            <option value="custom">Custom value</option>
        `;
  } else {
    return `
            <option value="drop">Drop rows</option>
            <option value="mode" selected>Mode</option>
            <option value="new_category">New category</option>
            <option value="custom">Custom value</option>
        `;
  }
}

function getTransformerOptions(type) {
  if (type.includes('int') || type.includes('float')) {
    return `
            <option value="standard" selected>Standard</option>
            <option value="minmax">Min Max</option>
            <option value="robust">Robust</option>
        `;
  } else {
    return `
            <option value="onehot">One Hot</option>
            <option value="ordinal" selected>Ordinal</option>
            <option value="label">Label</option>
        `;
  }
}

// Ajoutez des gestionnaires d'événements pour les sélecteurs
document.querySelectorAll('.imputation-select, .transformer-select').forEach(select => {
  select.addEventListener('change', function () {
    console.log('Feature configuration changed:', this.value);
  });
});


function setupTabs() {
  // Initialisation des onglets
  switchTab('features');

  // Gestion du redimensionnement
  window.addEventListener('resize', function () {
    const activeTab = document.querySelector('.sliding-tab.active');
    if (activeTab) updateIndicator(activeTab);
  });
}


function updateIndicator(activeTab) {
  const indicator = document.querySelector('.slider-indicator');
  const tabsContainer = document.querySelector('.sliding-tabs');

  if (indicator && tabsContainer) {
    const tabRect = activeTab.getBoundingClientRect();
    const containerRect = tabsContainer.getBoundingClientRect();

    indicator.style.width = `${tabRect.width}px`;
    indicator.style.transform = `translateX(${tabRect.left - containerRect.left}px)`;
  }
}

function setupModelSelection() {
  // Select/Deselect all
  document.getElementById('select-all-btn')?.addEventListener('click', function () {
    document.querySelectorAll('.model-checkbox').forEach(checkbox => {
      checkbox.checked = true;
      checkbox.closest('.model-card').classList.add('selected');
    });
  });

  document.getElementById('deselect-all-btn')?.addEventListener('click', function () {
    document.querySelectorAll('.model-checkbox').forEach(checkbox => {
      checkbox.checked = false;
      checkbox.closest('.model-card').classList.remove('selected');
    });
  });

  // Toggle selected style
  document.querySelectorAll('.model-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      this.closest('.model-card').classList.toggle('selected', this.checked);
    });
  });

  // Compare button
  document.getElementById('compare-btn')?.addEventListener('click', function () {
    const selectedModels = Array.from(document.querySelectorAll('.model-checkbox:checked'))
      .map(checkbox => checkbox.id.replace('-check', ''));

    if (selectedModels.length === 0) {
      showWarning('Please select at least one model to compare');
      return;
    }

    console.log('Comparing models:', selectedModels.join(', '));
  });
}


function getMethodName(methodKey) {
  const methodNames = {
    'random': 'Random Over-sampling',
    'smote': 'SMOTE',
    'adasyn': 'ADASYN',
    'borderline-smote': 'Borderline SMOTE',
    'swim-maha': 'SWIM Maha',
    'swim-rbf': 'SWIM RBF',
    'smotenc': 'SMOTENC'
  };
  return methodNames[methodKey] || methodKey;
}

function setupDropdowns() {
  // Font Awesome (if not already loaded)
  if (!document.querySelector('#font-awesome')) {
    const fa = document.createElement('link');
    fa.id = 'font-awesome';
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fa);
  }

  // Dropdown functionality
  document.querySelectorAll('.dropdown').forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    dropdown.querySelectorAll('li').forEach(item => {
      item.addEventListener('click', () => {
        const value = item.textContent;
        const icon = item.querySelector('i')?.className || '';
        dropdown.querySelector('.selected-value').innerHTML =
          icon ? `<i class="${icon}"></i> ${value.split('\n')[0]}` : value;
        dropdown.classList.remove('open');
      });
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
  });

  // Reset button
  document.querySelector('.btn-reset')?.addEventListener('click', () => {
    resetHyperparameters();
    showToast('Parameters reset to default values');
  });


}

function resetHyperparameters() {
  // Reset strategy method
  const strategyDropdown = document.querySelector('.strategy-method .dropdown');
  if (strategyDropdown) {
    strategyDropdown.querySelector('.selected-value').innerHTML = '<i class="fas fa-th"></i> Grid Search';
  }

  // Reset evaluation metric
  const metricDropdown = document.querySelector('.evaluation-metric .dropdown');
  if (metricDropdown) {
    metricDropdown.querySelector('.selected-value').innerHTML = '<i class="fas fa-check-circle"></i> Accuracy';
  }

  // Reset input fields
  const timeLimitInput = document.querySelector('.time-limit input');
  const maxCombinationsInput = document.querySelector('.max-combinations input');
  if (timeLimitInput) timeLimitInput.value = '3600';
  if (maxCombinationsInput) maxCombinationsInput.value = '-1';
}

// function setupSliders() {
//   const testSlider = document.getElementById('testSetRatio');
//   const testDisplay = document.getElementById('testSetRatioDisplay');

//   if (testSlider && testDisplay) {
//     testSlider.addEventListener('input', () => {
//       const value = (testSlider.value / 100).toFixed(2);
//       testDisplay.textContent = value;
//     });
//   }

//   const valSlider = document.getElementById('validationSetRatio');
//   const valDisplay = document.getElementById('validationSetRatioDisplay');

//   if (valSlider && valDisplay) {
//     valSlider.addEventListener('input', () => {
//       const value = (valSlider.value / 100).toFixed(2);
//       valDisplay.textContent = value;
//     });
//   }
// }


function updateSliderValue(slider) {
  const value = (slider.value / 100).toFixed(2);
  const valueDisplay = slider.nextElementSibling?.querySelector('.parameter-value');
  if (valueDisplay) valueDisplay.textContent = value;
}

function setupValidationMethods() {
  document.querySelectorAll('.method-option').forEach(option => {
    option.addEventListener('click', function () {
      document.querySelectorAll('.method-option').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
}




document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const feature = e.target.dataset.feature;
    if (e.target.checked) {
      selectedFeatures[feature] = {
        imputation: getImputationValue(feature),
        transformer: getTransformerValue(feature)
      };
    } else {
      delete selectedFeatures[feature];
    }
  });
});

function getImputationValue(feature) {
  return document.querySelector(`tr[data-feature="${feature}"] .imputation-select`).value;
}

function getTransformerValue(feature) {
  return document.querySelector(`tr[data-feature="${feature}"] .transformer-select`).value;
}

// function collectModelParameters() {
//     const models = [];
//     document.querySelectorAll('.model-card').forEach(card => {
//         const checkbox = card.querySelector('.model-checkbox');
//         if (checkbox.checked) {
//             const model = {
//                 name: card.getAttribute('data-model'),
//                 parameters: {}
//             };

//             card.querySelectorAll('.parameter-group').forEach(group => {
//                 const label = group.querySelector('label').textContent.trim();
//                 const input = group.querySelector('input, select');

//                 if (input) {
//                     model.parameters[label] = input.type === 'checkbox' ? input.checked : input.value;
//                 }
//             });

//             models.push(model);
//         }
//     });
//     return models;
// }

// function collectEvaluationParameters() {
//     return {
//         testSplit: {
//             ratio: document.getElementById('testSetRatio').value
//         },
//         validationSplit: {
//             method: document.querySelector('.method-option.selected').textContent.trim(),
//             ratio: document.getElementById('validationSetRatio').value,
//             balanced: document.querySelector('.options-group input[type="checkbox"]:nth-child(1)').checked,
//             shuffle: document.querySelector('.options-group input[type="checkbox"]:nth-child(2)').checked
//         }
//     };
// }

// function collectDataAugmentationParameters() {
//     const selectedMethodCard = document.querySelector('.method-card.selected');
//     return {
//         method: selectedMethodCard ? selectedMethodCard.getAttribute('data-method') : null
//     };
// }

// function collectHyperparametersParameters() {
//     return {
//         strategy: document.querySelector('.strategy-method .selected-value').textContent.trim(),
//         evaluationMetric: document.querySelector('.evaluation-metric .selected-value').textContent.trim(),
//         timeLimit: document.querySelector('.time-limit input').value,
//         maxCombinations: document.querySelector('.max-combinations input').value
//     };
// }
function runExperiment(useCaseId) {
  if (!useCaseId) {
    showError('Aucun use case sélectionné');
    return;
  }

  showConfirmation('Lancer l\'expérience?', 'Voulez-vous exécuter l\'expérience avec les paramètres sélectionnés?', () => {
    const experimentParams = collectExperimentParameters();

    showLoading('Exécution en cours', 'Veuillez patienter pendant que nous exécutons votre expérience...');

    fetch(`/entrainement/run_experiment/${useCaseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(experimentParams)
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          showSuccess('Expérience terminée! Redirection vers les résultats...', () => {
            // Redirection vers flow-table.html avec les paramètres
            window.location.href = `/entrainement/new_experiment?use_case_id=${useCaseId}&experiment_id=${data.experiment_id}`;
          });
        } else {
          showError(data.error || 'Une erreur est survenue');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showError('Une erreur est survenue lors de l\'exécution');
      });
  });
}

// Helper functions for notifications
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

function showConfirmation(title, text, confirmCallback) {
  Swal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Oui, lancer',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) confirmCallback();
  });
}

function showLoading(title, text) {
  Swal.fire({
    title: title,
    html: text,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });
}

function showSuccess(message, callback) {
  Swal.fire({
    title: 'Succès',
    html: message,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false
  }).then(callback);
}

function showWarning(message) {
  Swal.fire('Attention', message, 'warning');
}

function showError(message) {
  Swal.fire('Erreur', message, 'error');
}
// function collectExperimentParameters() {
//     return {
//         features: collectFeatureParameters(),
//         dimensionReduction: collectDimensionReductionParameters(),
//         models: collectModelParameters(),
//         evaluation: collectEvaluationParameters(),
//         dataAugmentation: collectDataAugmentationParameters(),
//         hyperparameters: collectHyperparametersParameters()
//     };
// }
function closePopup() {
  const popup = document.getElementById('popup');
  if (popup) {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 300);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const confirmBtn = document.getElementById("save-feature-btn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", saveFeatureConfiguration);
  }
});

// ✅ Script JavaScript complet avec contrôle de sauvegarde unique pour features et modèles

let featuresSaved = false;
let modelsSaved = false;

function runPreprocessingOnly() {
  const filename = document.querySelector('.dataset-info')?.dataset?.filename;
  const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');

  if (!filename || !useCaseId) {
    Swal.fire("Erreur", "Nom du fichier ou ID du cas d'utilisation manquant.", "error");
    return;
  }

  fetch(`/preprocess_only/${useCaseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: "target"
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        Swal.fire({
          title: "Prétraitement réussi",
          text: data.message,
          icon: "success",
          confirmButtonText: "Continuer"
        });
      } else {
        Swal.fire("Erreur", data.message || "Erreur pendant le prétraitement", "error");
      }
    })
    .catch(err => {
      console.error(err);
      Swal.fire("Erreur", "Une erreur est survenue lors du prétraitement", "error");
    });
}

function saveFeatureConfiguration() {
  return new Promise((resolve, reject) => {
    const rows = [...document.querySelectorAll("table tbody tr")];
    const data = rows.map(row => ({
      name: row.cells[1].innerText,
      selected: row.querySelector("input[type=checkbox]").checked,
      status: row.cells[2].innerText,
      type: row.cells[3].innerText,
      meaning: row.cells[4].innerText,
      imputation: row.cells[5].querySelector("select").value,
      transformer: row.cells[6].querySelector("select").value,
    }));

    fetch('/save_features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(response => {
        console.log('Features sauvegardées');
        resolve();
      })
      .catch(err => {
        console.error('Erreur lors de la sauvegarde des features:', err);
        reject(err);
      });
  });
}

function saveSelectedModels() {
  return new Promise((resolve, reject) => {
    const models = [];

    document.querySelectorAll('.model-card').forEach(card => {
      const checkbox = card.querySelector('.model-checkbox');
      if (!checkbox.checked) return;

      const modelName = card.dataset.model;
      const params = {};

      card.querySelectorAll('.parameter-group input').forEach(input => {
        const key = input.name;
        let value = input.value;

        if (value === "") return;
        if (!isNaN(value)) value = parseFloat(value);
        params[key] = value;
      });

      models.push({ name: modelName, selected: true, parameters: params });
    });

    const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
    if (!useCaseId) {
      Swal.fire("Erreur", "Use case ID manquant", "error");
      reject();
      return;
    }

    fetch(`/save_models/${useCaseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(models)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          console.log("Modèles sauvegardés");
          resolve();
        } else {
          Swal.fire("Erreur", data.message, "error");
          reject();
        }
      })
      .catch(err => {
        console.error("Erreur JS:", err);
        Swal.fire("Erreur", "Impossible de sauvegarder les modèles", "error");
        reject();
      });
  });
}

async function runPreprocessingAndGoToModels() {
  try {
    await runPreprocessingOnly();              // 1. Prétraitement
    await saveFeatureConfiguration();          // 2. Sauvegarde des features
    featuresSaved = true;
    switchTab('models');                       // 3. Aller à l'onglet suivant
  } catch (error) {
    console.warn("Erreur dans la transition vers 'models':", error);
    // 🔁 Ne rien faire → rester sur la tab actuelle
  }
}


async function saveModelsAndGoToTraining() {
  try {
    await saveSelectedModels();
    modelsSaved = true;
    switchTab('evaluation');
  } catch (err) {
    console.warn("Erreur dans la transition vers 'evaluation':", err);
  }
}


document.querySelectorAll('.feature-checkbox, .imputation-select, .transformer-select').forEach(el => {
  el.addEventListener('change', () => {
    featuresSaved = false;
  });
});

document.querySelectorAll('.model-checkbox, .parameter-group input').forEach(el => {
  el.addEventListener('change', () => {
    modelsSaved = false;
  });
});

function setupPopupInteractions(isPopup) {
  if (isPopup) {
    document.getElementById('cancel-experiment-btn')?.addEventListener('click', closePopup);

  } else {
    document.getElementById('run-experiment-btn')?.addEventListener('click', openPopup);
  }
}



// Boutons HTML à lier :
// <button id="go-to-models-btn" onclick="handleGoToModelsTab()" ... >
// <button id="go-to-training-btn" onclick="handleGoToTrainingTab()" ... >

function collectValidationConfig() {
  const method = document.querySelector('input[name="validation-method"]:checked')?.value || "shuffle_split";
  const validationRatio = parseFloat(document.getElementById("validationSetRatio")?.value || 0.1);
  const TestRatio = parseFloat(document.getElementById("testSetRatioDisplay")?.value || 0.1);
  const stratified = document.getElementById("stratify-checkbox")?.checked || false;
  const shuffle = document.getElementById("shuffle-checkbox")?.checked || false;
  const kFolds = parseInt(document.getElementById("kfold-count")?.value || 5);

  return {
    method,
    validation_ratio: validationRatio,
    test: TestRatio,
    stratified,
    shuffle,
    k_folds: method === "kfold" ? kFolds : null
  };
}


function saveValidationConfig() {
  const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
  if (!useCaseId) {
    showError("Use case ID manquant");
    return;
  }

  // Récupération des valeurs
  const method = document.querySelector('.method-option.selected')?.dataset?.method;
  const ratio = parseFloat(document.getElementById('validationSetRatio')?.value) / 100;
  const test_ratio = parseFloat(document.getElementById('testSetRatioDisplay')?.value) / 100;
  const stratify = document.getElementById('stratifyCheck')?.checked || false;
  const shuffle = document.getElementById('shuffleCheck')?.checked || false;

  const payload = {
    method,
    ratio,
    test_ratio,
    stratify,
    shuffle
  };

  fetch(`/save_validation/${useCaseId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        showSuccess("Configuration de validation sauvegardée");
      } else {
        showError(data.message || "Erreur lors de la sauvegarde");
      }
    })
    .catch(err => {
      console.error("Erreur JS:", err);
      showError("Impossible de sauvegarder la configuration de validation");
    });
}
function loadValidationConfig() {
  const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
  if (!useCaseId) return;

  fetch(`/get_validation/${useCaseId}`)
    .then(res => res.json())
    .then(data => {
      if (data.status !== 'success') return;

      // Méthode
      document.querySelectorAll('.method-option').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.method === data.method) {
          el.classList.add('selected');
        }
      });

      // Ratio validation
      const valRatio = document.getElementById('validationSetRatio');
      if (valRatio) {
        valRatio.value = data.ratio * 100;
        document.getElementById('validationSetRatioDisplay').textContent = data.ratio.toFixed(2);
      }
      // Ratio test
      const testRatio = document.getElementById('testSetRatio');
      if (testRatio) {
        testRatio.value = data.test_ratio * 100;
        document.getElementById('testSetRatioDisplay').textContent = data.test_ratio.toFixed(2);
      }

      // Checkbox stratify
      const stratify = document.getElementById('stratifyCheck');
      if (stratify) stratify.checked = data.stratify;

      // Checkbox shuffle
      const shuffle = document.getElementById('shuffleCheck');
      if (shuffle) shuffle.checked = data.shuffle;
    })
    .catch(err => {
      console.error("Erreur lors du chargement de la validation :", err);
    });
}
// Modifier la fonction setupSliders
function setupSliders() {
  const testSlider = document.getElementById('testSetRatio');
  const testDisplay = document.getElementById('testSetRatioDisplay');

  if (testSlider && testDisplay) {
    testDisplay.textContent = (testSlider.value / 100).toFixed(2);
    testSlider.addEventListener('input', () => {
      testDisplay.textContent = (testSlider.value / 100).toFixed(2);
    });
  }

  const valSlider = document.getElementById('validationSetRatio');
  const valDisplay = document.getElementById('validationSetRatioDisplay');

  if (valSlider && valDisplay) {
    valDisplay.textContent = (valSlider.value / 100).toFixed(2);
    valSlider.addEventListener('input', () => {
      valDisplay.textContent = (valSlider.value / 100).toFixed(2);
    });
  }
}

// Modifier la fonction setupValidationMethods
function setupValidationMethods() {
  // Gestion des méthodes de validation
  document.querySelectorAll('.method-option').forEach(option => {
    option.addEventListener('click', function () {
      document.querySelectorAll('.method-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      this.classList.add('selected');

      // Ajuster l'affichage en fonction de la méthode sélectionnée
      
    });
  });

  // Charger la configuration existante
  loadValidationConfig();
}

// Améliorer la fonction saveValidationConfig
async function saveValidationConfig() {
  try {
    const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
    if (!useCaseId) {
      throw new Error("Use case ID manquant");
    }

    const method = document.querySelector('.method-option.selected')?.dataset?.method || "shuffle_split";
    const ratio = parseFloat(document.getElementById('validationSetRatio').value) / 100;
    const test_ratio = parseFloat(document.getElementById('testSetRatio').value) / 100;
    const stratify = document.getElementById('stratifyCheck')?.checked || false;
    const shuffle = document.getElementById('shuffleCheck')?.checked || false;

    const response = await fetch(`/save_validation/${useCaseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        ratio,
        test_ratio,
        stratify,
        shuffle
      })
    });

    const data = await response.json();

    if (data.status === 'success') {
      showSuccess("Configuration de validation sauvegardée");
      return true;
    } else {
      throw new Error(data.message || "Erreur lors de la sauvegarde");
    }
  } catch (error) {
    console.error("Erreur:", error);
    showError(error.message);
    return false;
  }
}

// Améliorer la fonction loadValidationConfig
function loadValidationConfig() {
  const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
  if (!useCaseId) return;

  fetch(`/get_validation/${useCaseId}`)
    .then(res => res.json())
    .then(data => {
      if (data.status !== 'success') return;

      // Méthode de validation
      document.querySelectorAll('.method-option').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.method === data.method) {
          el.classList.add('selected');
        }
      });

      // Ratio de validation
      const valSlider = document.getElementById('validationSetRatio');
      const valDisplay = document.getElementById('validationSetRatioDisplay');
      if (valSlider && valDisplay) {
        if (data.method === 'kfold') {
          valSlider.min = 2;
          valSlider.max = 10;
          valSlider.value = data.ratio;
          valDisplay.textContent = data.ratio;
        } else {
          valSlider.min = 0;
          valSlider.max = 50;
          valSlider.value = data.ratio * 100;
          valDisplay.textContent = data.ratio.toFixed(2);
        }
      }

      // Options
      const stratify = document.getElementById('stratifyCheck');
      if (stratify) stratify.checked = data.stratify;

      const shuffle = document.getElementById('shuffleCheck');
      if (shuffle) shuffle.checked = data.shuffle;
    })
    .catch(err => {
      console.error("Erreur lors du chargement de la validation :", err);
    });
}

// Initialisation des méthodes d'augmentation de données
function setupDataAugmentationMethods() {
  let selectedMethod = null;

  // Gestion de la sélection des méthodes
  document.querySelectorAll('.method-card').forEach(card => {
    const selectBtn = card.querySelector('.method-select-btn');

    selectBtn.addEventListener('click', () => {
      // Désélectionner toutes les autres cartes
      document.querySelectorAll('.method-card').forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.method-params').style.display = 'none';
        c.querySelector('.method-select-btn').textContent = 'Select';
      });

      // Sélectionner la carte courante
      card.classList.add('selected');
      card.querySelector('.method-params').style.display = 'block';
      selectBtn.textContent = 'Selected';

      selectedMethod = card.dataset.method;
    });
  });

  // Sauvegarde de la configuration
  document.getElementById('save-augmentation-btn').addEventListener('click', () => {
    if (!selectedMethod) {
      showWarning('Please select a data augmentation method first');
      return;
    }

    saveAugmentationConfig();
  });

  // Réinitialisation
  document.getElementById('reset-augmentation-btn').addEventListener('click', () => {
    document.querySelectorAll('.method-card').forEach(c => {
      c.classList.remove('selected');
      c.querySelector('.method-params').style.display = 'none';
      c.querySelector('.method-select-btn').textContent = 'Select';
    });

    // Réinitialiser les paramètres par défaut
    document.querySelectorAll('.param-input').forEach(input => {
      input.value = input.min || 1;
    });

    document.querySelectorAll('.param-select').forEach(select => {
      select.selectedIndex = 0;
    });

    selectedMethod = null;
    showToast('Configuration reset');
  });

  // Charger la configuration existante
  loadAugmentationConfig();
}

// Sauvegarde de la configuration
async function saveAugmentationConfig() {
  try {
    const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
    if (!useCaseId) throw new Error("Use case ID missing");

    const selectedCard = document.querySelector('.method-card.selected');
    if (!selectedCard) throw new Error("No method selected");

    const method = selectedCard.dataset.method;
    const category = selectedCard.dataset.category;

    // Collecter les paramètres
    const params = {};
    selectedCard.querySelectorAll('.param-input, .param-select').forEach(param => {
      const key = param.dataset.param;
      const value = param.type === 'number' ? parseInt(param.value) : param.value;
      params[key] = value;
    });

    const response = await fetch(`/save_augmentation/${useCaseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        category,
        params
      })
    });

    const data = await response.json();

    if (data.status === 'success') {
      showSuccess('Data augmentation configuration saved');
      return true;
    } else {
      throw new Error(data.message || "Failed to save configuration");
    }
  } catch (error) {
    console.error("Error saving augmentation config:", error);
    showError(error.message);
    return false;
  }
}

// Chargement de la configuration
function loadAugmentationConfig() {
  const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
  if (!useCaseId) return;

  fetch(`/get_augmentation/${useCaseId}`)
    .then(res => res.json())
    .then(data => {
      if (data.status !== 'success' || !data.config) return;

      const config = data.config;
      const methodCard = document.querySelector(`.method-card[data-method="${config.method}"]`);

      if (methodCard) {
        // Sélectionner la méthode
        methodCard.classList.add('selected');
        methodCard.querySelector('.method-params').style.display = 'block';
        methodCard.querySelector('.method-select-btn').textContent = 'Selected';

        // Remplir les paramètres
        for (const [key, value] of Object.entries(config.params)) {
          const input = methodCard.querySelector(`[data-param="${key}"]`);
          if (input) {
            if (input.type === 'number') {
              input.value = value;
            } else if (input.tagName === 'SELECT') {
              const option = Array.from(input.options).find(opt => opt.value === value);
              if (option) option.selected = true;
            }
          }
        }
      }
    })
    .catch(err => {
      console.error("Error loading augmentation config:", err);
    });
}

function setupHyperparameterDropdown() {
  const dropdown = document.querySelector('.strategy-method .dropdown');
  const toggle = dropdown.querySelector('.dropdown-toggle');
  const menu = dropdown.querySelector('.dropdown-menu');
  const selectedValue = toggle.querySelector('.selected-value');

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      selectedValue.innerHTML = item.innerHTML;
      dropdown.dataset.strategy = item.dataset.strategy;
      menu.classList.remove('open');
    });
  });

  // Close if clicking outside
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) menu.classList.remove('open');
  });
}

function saveHyperparameterConfig() {
  const useCaseId = new URLSearchParams(window.location.search).get("use_case_id");
  if (!useCaseId) {
    showError("Use Case ID manquant");
    return;
  }

  const config = {
    strategy: document.getElementById("strategy-method").value,
    metric: document.getElementById("eval-metric").value,
    time_limit: parseInt(document.getElementById("time-limit").value),
    max_combinations: parseInt(document.getElementById("max-combinations").value),
  };

  fetch(`/save_hyperparameters/${useCaseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        showSuccess("Configuration sauvegardée avec succès");
      } else {
        showError(data.message || "Échec de la sauvegarde");
      }
    })
    .catch(err => {
      console.error(err);
      showError("Erreur lors de la sauvegarde");
    });
}

