document.addEventListener('DOMContentLoaded', function () {
    // Initialisation de l'application
    initApplication();
    setupTabs();
    setupModelSelection();
    setupDataAugmentationMethods();
    setupDropdowns();
    setupSliders(); 
    setupValidationMethods();

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
        checkbox.addEventListener('change', function() {
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
            updateDimensionOptions();
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
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser Feather Icons
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
  
  // Gestionnaire d'événements pour les onglets
  document.querySelectorAll('.sliding-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      switchTab(this.dataset.tab);
    });
  });
});
// Fonction pour réinitialiser les dimensions
function resetDimensionSettings() {
    // Réinitialiser les cases à cocher
    document.querySelectorAll('#dimension-reduction-content input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Réinitialiser PCA
    document.querySelector('#dimension-reduction-content input[type="checkbox"]').checked = true;
    document.querySelector('#dimension-reduction-content select').value = 'Target variance';
    document.getElementById('target-variance').value = 0.8;
    
    // Réinitialiser Random State
    document.getElementById('random-state').value = 5;
    
    showToast('Dimension reduction settings reset');
}

// Fonction pour sauvegarder les paramètres
function saveDimensionSettings() {
    const settings = collectDimensionReductionParameters();
    // Ici vous pourriez envoyer les données au serveur ou les stocker localement
    localStorage.setItem('savedDimensionSettings', JSON.stringify(settings));
    showToast('Dimension reduction settings saved');
}
// Fonction pour mettre à jour les options en fonction des features sélectionnées
function updateDimensionOptions() {
    const numericalFeatures = Object.values(selectedFeatures).filter(
        f => f.type.includes('int') || f.type.includes('float')
    ).length;

    // Activer/désactiver PCA en fonction des features numériques
    const pcaEnable = document.getElementById('pca-enable');
    pcaEnable.disabled = numericalFeatures === 0;
    
    // Mettre à jour le compteur de features
    document.getElementById('pca-feature-count').textContent = numericalFeatures;
    
    // Activer/désactiver les options de sélection de features
    document.querySelectorAll('.feature-selection-switch').forEach(switchEl => {
        switchEl.disabled = Object.keys(selectedFeatures).length === 0;
    });
}

// Fonction pour lier les switches avec les features
function setupFeatureSwitches() {
  // Activer/désactiver les switches en fonction des features sélectionnées
  document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const anySelected = document.querySelectorAll('.feature-checkbox:checked').length > 0;
      document.querySelectorAll('.feature-selection-switch').forEach(sw => {
        sw.disabled = !anySelected;
        if (!anySelected) sw.checked = false;
      });
    });
  });

  // Gérer l'affichage de la valeur de variance
  const varianceSlider = document.getElementById('target-variance');
  const varianceValue = document.getElementById('variance-value');
  
  varianceSlider.addEventListener('input', function() {
    varianceValue.textContent = parseFloat(this.value).toFixed(2);
  });

  // Activer/désactiver les options PCA en fonction du switch
  document.getElementById('pca-enable').addEventListener('change', function() {
    const pcaOptions = document.getElementById('pca-options');
    if (this.checked) {
      pcaOptions.style.display = 'block';
    } else {
      pcaOptions.style.display = 'none';
    }
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
    loadUseCaseData(useCaseId);

    // Configurer les interactions
    setupFeatureInteractions();
    setupDimensionReductionInteractions();
    setupPopupInteractions(isPopup);

    // Activer le premier onglet
    switchTab('features');
     // Relier Features et Dimension Reduction
    linkFeaturesWithDimensions();
    
    // Initialiser l'état des options
    updateDimensionOptions();
    collectDimensionReductionParameters();
    resetDimensionSettings();
}
function collectDimensionReductionParameters() {
    // Vérifier si les éléments existent avant d'y accéder
    const pcaEnable = document.getElementById('pca-enable');
    const pcaMode = document.querySelector('#pca-options select');
    const targetVariance = document.getElementById('target-variance');
    const randomState = document.getElementById('random-state');
    
    return {
        // Features sélectionnées
        selectedFeatures: Object.keys(selectedFeatures),
        
        // Paramètres de sélection de features
        featureSelection: {
            removeMissing: document.querySelector('[data-target="missing"]').checked,
            removeSingleValue: document.querySelector('[data-target="single-value"]').checked,
            removeColinear: document.querySelector('[data-target="colinear"]').checked,
            removeZeroImportance: document.querySelector('[data-target="zero-importance"]').checked,
            removeLowImportance: document.querySelector('[data-target="low-importance"]').checked,
            keepTopFeatures: document.querySelector('[data-target="top-features"]')?.checked || false,
            topFeaturesCount: document.querySelector('[data-target="top-features-count"]')?.value || 10
        },
        
        // Paramètres PCA
        pca: pcaEnable ? {
            enabled: pcaEnable.checked,
            mode: pcaMode ? pcaMode.value : null,
            nComponents: pcaMode?.value === 'Number of components' 
                ? document.getElementById('n-components')?.value 
                : null,
            targetVariance: targetVariance ? parseFloat(targetVariance.value) : 0.95,
            whiten: document.getElementById('pca-whiten')?.checked || false,
            svdSolver: document.getElementById('pca-solver')?.value || 'auto'
        } : null,
        
        // Paramètres généraux
        general: {
            randomState: randomState ? parseInt(randomState.value) : 42,
            scalingMethod: document.getElementById('scaling-method')?.value || 'standard'
        },
        
        // Méthodes alternatives
        otherMethods: {
            tsne: document.getElementById('tsne-enable')?.checked ? {
                perplexity: document.getElementById('tsne-perplexity')?.value || 30,
                earlyExaggeration: document.getElementById('tsne-exaggeration')?.value || 12,
                learningRate: document.getElementById('tsne-learning-rate')?.value || 200
            } : null,
            umap: document.getElementById('umap-enable')?.checked ? {
                nNeighbors: document.getElementById('umap-neighbors')?.value || 15,
                minDist: document.getElementById('umap-min-dist')?.value || 0.1,
                metric: document.getElementById('umap-metric')?.value || 'euclidean'
            } : null
        }
    };
}

function resetDimensionSettings() {
    // Réinitialiser les paramètres
    document.querySelectorAll('.feature-selection-switch').forEach(switchEl => {
        switchEl.checked = false;
    });
    
    document.getElementById('pca-enable').checked = false;
    
    // Mettre à jour l'interface
    updateDimensionOptions();
}
function setupFeatureInteractions() {
    // Gestion des cases à cocher
    document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateDimensionOptions();
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
    document.getElementById('select-all-features-btn')?.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.feature-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            cb.dispatchEvent(new Event('change'));
        });
    });
}

function setupDimensionReductionInteractions() {
    linkDimensionsWithFeatures();
    
    document.getElementById('reset-dimension-btn')?.addEventListener('click', resetDimensionSettings);
    document.getElementById('save-dimension-btn')?.addEventListener('click', saveDimensionSettings);
    
    // Gestion du slider PCA
    const varianceSlider = document.getElementById('target-variance');
    const varianceValue = document.getElementById('variance-value');
    if (varianceSlider && varianceValue) {
        varianceSlider.addEventListener('input', function() {
            varianceValue.textContent = parseFloat(this.value).toFixed(2);
        });
    }
}

function setupPopupInteractions(isPopup) {
    if (isPopup) {
        document.getElementById('cancel-experiment-btn')?.addEventListener('click', closePopup);
        document.getElementById('confirm-experiment-btn')?.addEventListener('click', function() {
            const useCaseId = new URLSearchParams(window.location.search).get('use_case_id');
            if (useCaseId) {
                runExperiment(useCaseId);
            }
            closePopup();
        });
    } else {
        document.getElementById('run-experiment-btn')?.addEventListener('click', openPopup);
    }
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
    
    // Gestion du bouton "Select All"
    document.getElementById('select-all-features-btn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.feature-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
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
        select.addEventListener('change', function() {
            console.log('Feature configuration changed:', this.value);
        });
    });


function setupTabs() {
    // Initialisation des onglets
    switchTab('features');
    
    // Gestion du redimensionnement
    window.addEventListener('resize', function() {
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
    document.getElementById('select-all-btn')?.addEventListener('click', function() {
        document.querySelectorAll('.model-checkbox').forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('.model-card').classList.add('selected');
        });
    });
    
    document.getElementById('deselect-all-btn')?.addEventListener('click', function() {
        document.querySelectorAll('.model-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.model-card').classList.remove('selected');
        });
    });
    
    // Toggle selected style
    document.querySelectorAll('.model-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            this.closest('.model-card').classList.toggle('selected', this.checked);
        });
    });
    
    // Compare button
    document.getElementById('compare-btn')?.addEventListener('click', function() {
        const selectedModels = Array.from(document.querySelectorAll('.model-checkbox:checked'))
                                  .map(checkbox => checkbox.id.replace('-check', ''));
        
        if (selectedModels.length === 0) {
            showWarning('Please select at least one model to compare');
            return;
        }
        
        console.log('Comparing models:', selectedModels.join(', '));
    });
}

function setupDataAugmentationMethods() {
    const methodCards = document.querySelectorAll('.method-card');
    const selectModelBtn = document.getElementById('select-model-btn');
    
    methodCards.forEach(card => {
        card.addEventListener('click', function() {
            methodCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    selectModelBtn?.addEventListener('click', function() {
        const selectedCard = document.querySelector('.method-card.selected');
        
        if (selectedCard) {
            const method = selectedCard.getAttribute('data-method');
            showSuccess(`You selected: <strong>${getMethodName(method)}</strong>`);
        } else {
            showWarning('Please select a data augmentation method first');
        }
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
    
    // Apply button
    document.querySelector('.btn-apply')?.addEventListener('click', () => {
        showToast('Hyperparameters applied successfully');
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

function setupSliders() {
    const testSetSlider = document.getElementById('testSetRatio');
    const validationSetSlider = document.getElementById('validationSetRatio');
    
    if (testSetSlider) {
        testSetSlider.addEventListener('input', function() {
            updateSliderValue(this);
        });
    }
    
    if (validationSetSlider) {
        validationSetSlider.addEventListener('input', function() {
            updateSliderValue(this);
        });
    }
}

function updateSliderValue(slider) {
    const value = (slider.value / 100).toFixed(2);
    const valueDisplay = slider.nextElementSibling?.querySelector('.parameter-value');
    if (valueDisplay) valueDisplay.textContent = value;
}

function setupValidationMethods() {
    document.querySelectorAll('.method-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.method-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}
function collectFeatureParameters() {
    const features = [];
    document.querySelectorAll('.feature-table tbody tr').forEach(row => {
        const checkbox = row.querySelector('.feature-checkbox');
        if (!checkbox) return;

        const name = row.querySelector('td:nth-child(2)').textContent.trim();
        const selected = checkbox.checked;
        const enabled = row.querySelector('.status-toggle')?.checked ?? true;
        const type = row.querySelector('td:nth-child(4)').textContent.trim();
        const meaning = row.querySelector('.meaning-cell')?.textContent.trim() || 'unknown';
        const imputation = row.querySelector('.imputation-select')?.value || null;
        const transformer = row.querySelector('.transformer-select')?.value || null;

        // On n'ajoute que les features sélectionnées
        if (selected) {
            features.push({
                name,
                selected,
                enabled,
                type,
                meaning,
                imputation,
                transformer
            });
        }
    });
    return features;
}



// Modifiez la fonction de collecte des paramètres
function collectDimensionReductionParameters() {
  const selectedFeatures = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
    .map(cb => cb.dataset.feature);

  return {
    selectedFeatures: selectedFeatures,
    featureSelection: {
      removeMissing: document.querySelector('[data-target="missing"]').checked,
      removeSingleValue: document.querySelector('[data-target="single-value"]').checked,
      removeColinear: document.querySelector('[data-target="colinear"]').checked,
      removeZeroImportance: document.querySelector('[data-target="zero-importance"]').checked,
      removeLowImportance: document.querySelector('[data-target="low-importance"]').checked
    },
    pca: {
      enabled: document.getElementById('pca-enable').checked,
      mode: document.querySelector('#pca-options select').value,
      targetVariance: document.getElementById('target-variance').value
    }
  };
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
function applyDimensionReduction() {
  console.log("Features sélectionnées avec paramètres :", selectedFeatures);
  // ici tu appelles le backend ou tu lances la réduction en utilisant selectedFeatures
}
fetch('/apply_dimension_reduction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ features: selectedFeatures, dimension_params: chosenDimensionParams })
})
.then(res => res.json())
.then(data => console.log('Résultat :', data));

function collectModelParameters() {
    const models = [];
    document.querySelectorAll('.model-card').forEach(card => {
        const checkbox = card.querySelector('.model-checkbox');
        if (checkbox.checked) {
            const model = {
                name: card.getAttribute('data-model'),
                parameters: {}
            };
            
            card.querySelectorAll('.parameter-group').forEach(group => {
                const label = group.querySelector('label').textContent.trim();
                const input = group.querySelector('input, select');
                
                if (input) {
                    model.parameters[label] = input.type === 'checkbox' ? input.checked : input.value;
                }
            });
            
            models.push(model);
        }
    });
    return models;
}

function collectEvaluationParameters() {
    return {
        testSplit: {
            ratio: document.getElementById('testSetRatio').value
        },
        validationSplit: {
            method: document.querySelector('.method-option.selected').textContent.trim(),
            ratio: document.getElementById('validationSetRatio').value,
            balanced: document.querySelector('.options-group input[type="checkbox"]:nth-child(1)').checked,
            shuffle: document.querySelector('.options-group input[type="checkbox"]:nth-child(2)').checked
        }
    };
}

function collectDataAugmentationParameters() {
    const selectedMethodCard = document.querySelector('.method-card.selected');
    return {
        method: selectedMethodCard ? selectedMethodCard.getAttribute('data-method') : null
    };
}

function collectHyperparametersParameters() {
    return {
        strategy: document.querySelector('.strategy-method .selected-value').textContent.trim(),
        evaluationMetric: document.querySelector('.evaluation-metric .selected-value').textContent.trim(),
        timeLimit: document.querySelector('.time-limit input').value,
        maxCombinations: document.querySelector('.max-combinations input').value
    };
}
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
function collectExperimentParameters() {
    return {
        features: collectFeatureParameters(),
        dimensionReduction: collectDimensionReductionParameters(),
        models: collectModelParameters(),
        evaluation: collectEvaluationParameters(),
        dataAugmentation: collectDataAugmentationParameters(),
        hyperparameters: collectHyperparametersParameters()
    };
}
function closePopup() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }
}