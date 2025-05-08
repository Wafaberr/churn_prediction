// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initApplication();
});

function initApplication() {
    // Initialiser Feather Icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Récupérer l'ID du use case depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const useCaseId = urlParams.get('use_case_id');
    const filename = '{{ filename }}'; // Récupéré depuis le template
    
    // Initialiser les composants
    setupTabs();
    setupModelSelection();
    setupDataAugmentationMethods();
    setupDropdowns();
    setupSliders();
    setupValidationMethods();
    linkDimensionsWithFeatures();
    setupFeatureSwitches();
    
    // Écouteurs d'événements
    document.getElementById('reset-dimension-btn')?.addEventListener('click', resetDimensionSettings);
    document.getElementById('save-dimension-btn')?.addEventListener('click', saveDimensionSettings);
    document.getElementById('run-experiment-btn')?.addEventListener('click', () => runExperiment(useCaseId));
    
    // Charger les données si disponibles
    if (filename) loadDatasetColumns(filename);
    if (useCaseId) loadUseCaseData(useCaseId);
}

// Fonctions pour les onglets
function setupTabs() {
    switchTab('features');
    window.addEventListener('resize', function() {
        const activeTab = document.querySelector('.sliding-tab.active');
        if (activeTab) updateIndicator(activeTab);
    });
    
    // Ajouter les écouteurs d'événements pour les onglets
    document.querySelectorAll('.sliding-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

function switchTab(tabId) {
    // Mettre à jour les boutons
    document.querySelectorAll('.sliding-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
        if (tab.dataset.tab === tabId) updateIndicator(tab);
    });
    
    // Mettre à jour le contenu
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabId}-content`);
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

// Fonctions pour la gestion des features
function loadDatasetColumns(filename) {
    fetch(`/get_dataset_columns/${filename}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            updateFeatureTable(data.columns, data.dtypes);
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to load dataset columns');
        });
}

function updateFeatureTable(columns, dtypes) {
    const tbody = document.querySelector('.feature-table tbody');
    tbody.innerHTML = '';
    
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
    document.getElementById('select-all-features-btn')?.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.feature-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    });
    
    // Mettre à jour les options de dimension
    document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateDimensionOptions);
    });
}

// Fonctions pour la réduction de dimension
function linkDimensionsWithFeatures() {
    const featureCheckboxes = document.querySelectorAll('.feature-checkbox');
    const dimensionCheckboxes = document.querySelectorAll('#dimension-reduction-content input[type="checkbox"]');
    
    featureCheckboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', () => {
            if (index < dimensionCheckboxes.length) {
                dimensionCheckboxes[index].disabled = !checkbox.checked;
                if (!checkbox.checked) dimensionCheckboxes[index].checked = false;
            }
        });
        
        // Initial state
        if (index < dimensionCheckboxes.length) {
            dimensionCheckboxes[index].disabled = !checkbox.checked;
        }
    });
}

function setupFeatureSwitches() {
    document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const anySelected = document.querySelectorAll('.feature-checkbox:checked').length > 0;
            document.querySelectorAll('.feature-selection-switch').forEach(sw => {
                sw.disabled = !anySelected;
                if (!anySelected) sw.checked = false;
            });
        });
    });

    const varianceSlider = document.getElementById('target-variance');
    const varianceValue = document.getElementById('variance-value');
    if (varianceSlider && varianceValue) {
        varianceSlider.addEventListener('input', function() {
            varianceValue.textContent = parseFloat(this.value).toFixed(2);
        });
    }

    document.getElementById('pca-enable')?.addEventListener('change', function() {
        const pcaOptions = document.getElementById('pca-options');
        if (pcaOptions) pcaOptions.style.display = this.checked ? 'block' : 'none';
    });
}

function updateDimensionOptions() {
    const selectedFeatures = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
        .map(cb => ({
            name: cb.dataset.feature,
            type: cb.closest('tr').querySelector('td:nth-child(4)').textContent
        }));

    const numericalFeatures = selectedFeatures.filter(f => 
        f.type.includes('int') || f.type.includes('float'));
    
    // Activer/désactiver les options de sélection de features
    document.querySelectorAll('.feature-selection-option').forEach(opt => {
        opt.disabled = selectedFeatures.length === 0;
        if (selectedFeatures.length > 0) opt.checked = false;
    });

    // Gérer PCA
    const pcaEnable = document.getElementById('pca-enable');
    const pcaParams = document.querySelectorAll('.pca-param');
    const pcaFeatureCount = document.getElementById('pca-feature-count');
    
    if (pcaEnable) pcaEnable.disabled = numericalFeatures.length === 0;
    if (pcaFeatureCount) pcaFeatureCount.textContent = numericalFeatures.length;
    
    if (numericalFeatures.length > 0) {
        if (pcaEnable) pcaEnable.checked = true;
        pcaParams.forEach(param => param.disabled = false);
    } else {
        if (pcaEnable) pcaEnable.checked = false;
        pcaParams.forEach(param => param.disabled = true);
    }
}

function resetDimensionSettings() {
    document.querySelectorAll('#dimension-reduction-content input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.querySelector('#dimension-reduction-content input[type="checkbox"]')?.checked = true;
    document.querySelector('#dimension-reduction-content select')?.value = 'Target variance';
    document.getElementById('target-variance').value = 0.8;
    document.getElementById('random-state').value = 5;
    
    showToast('Dimension reduction settings reset');
}

function saveDimensionSettings() {
    const settings = collectDimensionReductionParameters();
    localStorage.setItem('savedDimensionSettings', JSON.stringify(settings));
    showToast('Dimension reduction settings saved');
}

// Fonctions pour la collecte des paramètres
function collectDimensionReductionParameters() {
    return {
        selectedFeatures: Array.from(document.querySelectorAll('.feature-checkbox:checked'))
            .map(cb => cb.dataset.feature),
        featureSelection: {
            removeMissing: document.querySelector('[data-target="missing"]')?.checked || false,
            removeSingleValue: document.querySelector('[data-target="single-value"]')?.checked || false,
            removeColinear: document.querySelector('[data-target="colinear"]')?.checked || false,
            removeZeroImportance: document.querySelector('[data-target="zero-importance"]')?.checked || false,
            removeLowImportance: document.querySelector('[data-target="low-importance"]')?.checked || false
        },
        pca: {
            enabled: document.getElementById('pca-enable')?.checked || false,
            mode: document.querySelector('#pca-options select')?.value || 'Target variance',
            targetVariance: document.getElementById('target-variance')?.value || 0.8
        }
    };
}

// Fonctions utilitaires
function getMeaningFromType(type) {
    if (type.includes('int') || type.includes('float')) return 'Numerical';
    if (type.includes('object') || type.includes('string')) return 'Categorical';
    if (type.includes('bool')) return 'Boolean';
    if (type.includes('datetime')) return 'Date';
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

// Fonctions pour les notifications
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