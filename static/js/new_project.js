// Mapping des types de tâches
const taskTypeMapping = {
    'binary': 'Classification binaire',
    'multi': 'Classification multiclasse', 
    'regression': 'Régression',
    'clustering': 'Clustering'
};

// Variables globales
const appData = document.getElementById('app-data');
const filename = appData ? appData.dataset.filename : null;
let selectedTask = null;
let isSubmitting = false;

// Éléments DOM
const elements = {
    useCaseModal: document.getElementById('useCaseModal'),
    targetColumnSelect: document.getElementById('targetColumnSelect'),
    positiveClassSelect: document.getElementById('positiveClassSelect'),
    positiveClassContainer: document.getElementById('positiveClassContainer'),
    transformerSelect: document.getElementById('transformerSelect'),
    usecaseName: document.getElementById('usecaseName'),
    usecaseTag: document.getElementById('usecaseTag'),
    usecaseDescription: document.getElementById('usecaseDescription'),
    step2NextBtn: document.getElementById('step2NextBtn'),
    step3NextBtn: document.getElementById('step3NextBtn'),
    createUseCaseBtn: document.getElementById('createUseCaseBtn'),
    confirmDeleteModal: document.getElementById('confirmDeleteModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn')
};

// Fonction pour afficher une notification
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Fonction d'échappement HTML
function escapeHtml(unsafe) {
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Ouvre le modal de confirmation de suppression
 * @param {string} useCaseId - L'ID du cas d'utilisation à supprimer
 */
// Pour la modification
function showDeleteConfirmation(useCaseId, useCaseType) {
    if (!elements.confirmDeleteModal) return;
    
    elements.confirmDeleteModal.dataset.useCaseId = useCaseId;
    elements.confirmDeleteModal.dataset.useCaseType = useCaseType;
    
    elements.confirmDeleteModal.classList.remove('hidden');
    elements.confirmDeleteModal.classList.add('flex');
}

/**
 * Ferme le modal de confirmation de suppression
 */
function hideDeleteConfirmation() {
    if (!elements.confirmDeleteModal) return;
    elements.confirmDeleteModal.classList.add('hidden');
    elements.confirmDeleteModal.classList.remove('flex');
    delete elements.confirmDeleteModal.dataset.useCaseId;
}

/**
 * Confirme et exécute la suppression
 */
// Pour la suppression
async function confirmDelete() {
    const useCaseId = elements.confirmDeleteModal.dataset.useCaseId;
    const useCaseType = elements.confirmDeleteModal.dataset.useCaseType;
    
    if (!useCaseId || !useCaseType) {
        showNotification('ID ou type du cas d\'utilisation manquant', 'error');
        return;
    }

    try {
        const endpoint = useCaseType === 'pretrained' 
            ? '/use_case/delete_pretrained_usecase' 
            : '/use_case/delete_usecase';
            
        const response = await fetch(`${endpoint}?id=${useCaseId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Échec de la suppression');
        }

        await loadUseCases();
        showNotification('Cas d\'utilisation supprimé avec succès', 'success');
    } catch (error) {
        console.error('Erreur suppression:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
        hideDeleteConfirmation();
    }
}

/**
 * Ouvre le modal de modification avec les données existantes
 */
function openEditModal(useCaseId) {
    fetch(`/use_case/get_usecase_details?id=${useCaseId}`)
        .then(response => {
            if (!response.ok) throw new Error('Erreur réseau');
            return response.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            // Remplir le formulaire
            elements.usecaseName.value = data.name || '';
            elements.usecaseTag.value = data.tag || '';
            elements.usecaseDescription.value = data.description || '';
            
            // Stocker l'ID et le type de tâche
            elements.useCaseModal.dataset.editingId = useCaseId;
            selectedTask = data.task_type;
            
            // Mettre en évidence la tâche
            highlightSelectedTask(data.task_type);
            
            // Ouvrir directement à l'étape 4
            openModal();
            goToStep(4);
        })
        .catch(error => {
            console.error("Erreur:", error);
            showNotification(`Erreur: ${error.message}`, 'error');
        });
}

/**
 * Met en évidence la tâche sélectionnée
 */
function highlightSelectedTask(taskType) {
    if (!taskType) return;
    
    document.querySelectorAll('.ml-task-option').forEach(opt => {
        opt.classList.remove('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
        const taskText = opt.textContent.trim().toLowerCase();
        
        if (taskText.includes(taskTypeMapping[taskType]?.toLowerCase())) {
            opt.classList.add('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
        }
    });
}

/**
 * Ouvre le modal de création de cas d'utilisation
 */
function openModal() {
    if (!elements.useCaseModal) {
        console.error("Modal non trouvé");
        return;
    }
    elements.useCaseModal.classList.remove('hidden');
    elements.useCaseModal.classList.add('flex');
    goToStep(1);
}

/**
 * Ferme le modal de création de cas d'utilisation
 */
function closeModal() {
    if (!elements.useCaseModal) return;
    elements.useCaseModal.classList.add('hidden');
    elements.useCaseModal.classList.remove('flex');
}

/**
 * Navigue entre les étapes du formulaire
 */
function goToStep(stepNumber) {
     if (stepNumber === 'pretrained') {
        // Étape de sélection de tâche ML pour modèle pré-entraîné
        document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
        document.getElementById('stepPretrained').classList.remove('hidden');
        return;
    }

    if (stepNumber === 'pretrainedTarget') {
        // Étape des paramètres cible pour modèle pré-entraîné
        document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
        document.getElementById('stepPretrainedTarget').classList.remove('hidden');
        
        // Charger les colonnes cibles
        loadPretrainedTargetColumns();
        return;
    }

    if (stepNumber === 'pretrainedModel') {
        // Étape d'import du modèle pré-entraîné
        document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
        document.getElementById('stepPretrainedModel').classList.remove('hidden');
        return;
    }

    if (stepNumber === 'pretrainedDetails') {
        // Étape des détails pour modèle pré-entraîné
        if (!selectedModel && !uploadedModelFile) {
            showNotification("Veuillez sélectionner ou importer un modèle d'abord !", 'error');
            return;
        }
        document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
        document.getElementById('stepPretrainedDetails').classList.remove('hidden');
        return;
    }


    if (stepNumber === 3 && !selectedTask) {
        showNotification("Veuillez sélectionner un type de tâche ML d'abord !", 'error');
        return;
    }

    if (stepNumber === 3) loadTargetColumns();

    document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
    
    const stepElement = document.getElementById(`step${stepNumber}`);
    if (stepElement) stepElement.classList.remove('hidden');
}

/**
 * Sélectionne le type de tâche ML
 */
function selectTask(event, task) {
    selectedTask = task;
    
    // Mettre en évidence l'option sélectionnée
    document.querySelectorAll('.ml-task-option').forEach(opt => {
        opt.classList.remove('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
    });
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
    
    // Activer le bouton Suivant approprié selon le flux
    if (document.getElementById('stepPretrained') && !document.getElementById('stepPretrained').classList.contains('hidden')) {
        // Flux pré-entraîné
        const btn = document.getElementById('stepPretrainedNextBtn');
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else {
        // Flux normal
        validateStep(2);
    }
    
    // Gérer la classe positive pour classification binaire
    const positiveClassContainer = document.getElementById("positiveClassContainer");
    if (positiveClassContainer) {
        positiveClassContainer.classList.toggle('hidden', task !== 'binary');
    }
}

/**
 * Charge les colonnes cibles depuis le serveur
 */
async function loadTargetColumns() {
    if (!filename || !elements.targetColumnSelect) return;
    
    elements.targetColumnSelect.innerHTML = '<option value="">Chargement...</option>';

    try {
        const response = await fetch(`/data_set/get_string_columns?filename=${encodeURIComponent(filename)}`);
        if (!response.ok) throw new Error(await response.text());
        
        const columns = await response.json();
        elements.targetColumnSelect.innerHTML = '<option value="">-- Sélectionnez une colonne --</option>';
        
        if (columns.length === 0) {
            elements.targetColumnSelect.innerHTML += '<option value="" disabled>Aucune colonne valide trouvée</option>';
        } else {
            columns.forEach(col => {
                elements.targetColumnSelect.innerHTML += `<option value="${col}">${col}</option>`;
            });
        }
    } catch (error) {
        console.error("Erreur:", error);
        elements.targetColumnSelect.innerHTML = `<option value="">Erreur: ${error.message}</option>`;
    } finally {
        validateStep(3);
    }
}

/**
 * Gère le changement de colonne cible
 */
async function handleTargetColumnChange() {
    if (!elements.targetColumnSelect || !elements.positiveClassSelect) return;
    
    const column = elements.targetColumnSelect.value;
    if (!column) {
        if (elements.positiveClassContainer) elements.positiveClassContainer.classList.add("hidden");
        validateStep(3);
        return;
    }

    elements.positiveClassSelect.innerHTML = '<option value="">Chargement...</option>';
    
    try {
        const response = await fetch(`/data_set/get_column_values?filename=${encodeURIComponent(filename)}&column=${encodeURIComponent(column)}`);
        if (!response.ok) throw new Error(await response.text());
        
        const values = await response.json();
        elements.positiveClassSelect.innerHTML = '<option value="">Sélectionnez la classe positive</option>';
        values.forEach(v => {
            elements.positiveClassSelect.innerHTML += `<option value="${v}">${v}</option>`;
        });
        
        if (selectedTask === 'binary' && elements.positiveClassContainer) {
            elements.positiveClassContainer.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Erreur:", err);
        elements.positiveClassSelect.innerHTML = `<option value="">Erreur: ${err.message}</option>`;
        if (elements.positiveClassContainer) elements.positiveClassContainer.classList.add("hidden");
    } finally {
        validateStep(3);
    }
}

/**
 * Valide les champs d'une étape
 */
function validateStep(step) {
    let btn, isValid = false;
    
    switch(step) {
        case 2: isValid = selectedTask !== null; break;
        case 3: 
            isValid = elements.targetColumnSelect?.value && 
                     elements.transformerSelect?.value &&
                     (selectedTask !== 'binary' || elements.positiveClassSelect?.value);
            break;
        case 4: 
            isValid = elements.usecaseName?.value.trim() && 
                     elements.usecaseTag?.value.trim();
            break;
        default: return;
    }

    btn = document.getElementById(`step${step}NextBtn`) || elements.createUseCaseBtn;
    if (!btn) return;

    btn.disabled = !isValid;
    btn.classList.toggle('opacity-50', !isValid);
    btn.classList.toggle('cursor-not-allowed', !isValid);
}

/**
 * Soumet le formulaire (création ou modification)
 */
async function submitUseCase() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    const btn = elements.createUseCaseBtn;
    btn.disabled = true;
    
    const isEditing = elements.useCaseModal.dataset.editingId;
    const url = isEditing ? `/use_case/update_usecase/${isEditing}` : '/use_case/create_usecase';
    
    const useCaseData = {
        usecase_name: elements.usecaseName.value.trim(),
        usecase_tag: elements.usecaseTag.value.trim(),
        usecase_description: elements.usecaseDescription.value.trim(),
        dataset: filename,
        task_type: selectedTask
    };

    try {
        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(useCaseData)
        });

        if (!response.ok) throw new Error(await response.text());
        
        const result = await response.json();
        loadUseCases();
        closeModal();
        
        showNotification(
            isEditing ? 'Cas mis à jour avec succès' : 'Cas créé avec succès', 
            'success'
        );
        
        if (!isEditing) {
            elements.usecaseName.value = '';
            elements.usecaseTag.value = '';
            elements.usecaseDescription.value = '';
            selectedTask = null;
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
        isSubmitting = false;
        btn.disabled = false;
    }
}

/**
 * Charge la liste des cas d'utilisation
 */
async function loadUseCases() {
    const container = document.getElementById("useCasesList");
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

    try {
        const response = await fetch(`/use_case/get_use_cases?filename=${encodeURIComponent(filename)}`);
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const useCases = await response.json();
        
        if (useCases.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Aucun cas d\'utilisation</p>';
            return;
        }

        container.innerHTML = useCases.map(useCase => `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div onclick="navigateToExperiment('${useCase.id}', '${useCase.type}')" class="cursor-pointer flex-grow">
                        <h4 class="font-semibold">${escapeHtml(useCase.name)}</h4>
                        <p class="text-sm text-gray-600 mt-1">${escapeHtml(useCase.description || 'Pas de description')}</p>
                        <div class="mt-2 flex gap-2">
                            <span class="text-xs ${useCase.type === 'pretrained' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded">
                                ${useCase.type === 'pretrained' ? 'Modèle pré-entraîné' : escapeHtml(useCase.task_type)}
                            </span>
                            <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">${useCase.created_at}</span>
                        </div>
                    </div>
                    <div class="relative">
                        <button class="text-gray-500 hover:text-gray-700" 
                                onclick="event.stopPropagation(); toggleDropdown('dropdown-${useCase.id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div id="dropdown-${useCase.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                               onclick="event.stopPropagation(); openEditModal('${useCase.id}', '${useCase.type}')">
                                <i class="fas fa-pen mr-2"></i> Modifier
                            </a>
                            <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100" 
                               onclick="event.preventDefault(); event.stopPropagation(); showDeleteConfirmation('${useCase.id}', '${useCase.type}')">
                                <i class="fas fa-trash mr-2"></i> Supprimer
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erreur:", error);
        container.innerHTML = `
            <div class="text-red-500 text-center py-4">
                <p>Erreur de chargement</p>
                <button onclick="loadUseCases()" class="mt-2 text-blue-500 hover:underline">
                    <i class="fas fa-sync-alt mr-1"></i> Réessayer
                </button>
            </div>
        `;
    }
}

/**
 * Affiche/masque un menu déroulant
 */
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    dropdown.classList.toggle('hidden');
    
    // Fermer les autres menus déroulants
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== dropdownId) menu.classList.add('hidden');
    });
    
    event.stopPropagation();
}

/**
 * Redirige vers la page d'expérimentation
 */
// Pour la navigation
function navigateToExperiment(useCaseId, type) {
    if (!filename) return;
    const route = type === 'pretrained' 
        ? `/entrainement/pretrained_experiment` 
        : `/entrainement/newexperiment`;
    window.location.href = `${route}?filename=${encodeURIComponent(filename)}&use_case_id=${useCaseId}`;
}
// Initialisation des écouteurs d'événements
function initEventListeners() {
    // Options de tâche ML
    document.querySelectorAll('.ml-task-option').forEach(option => {
        option.addEventListener('click', (e) => selectTask(e, e.currentTarget.dataset.task));
    });

    // Champs du formulaire
    if (elements.targetColumnSelect) {
        elements.targetColumnSelect.addEventListener('change', () => {
            if (selectedTask === 'binary') handleTargetColumnChange();
            validateStep(3);
        });
    }

    if (elements.transformerSelect) {
        elements.transformerSelect.addEventListener('change', () => validateStep(3));
    }

    if (elements.positiveClassSelect) {
        elements.positiveClassSelect.addEventListener('change', () => validateStep(3));
    }

    if (elements.usecaseName && elements.usecaseTag) {
        const validateStep4 = () => {
            if (document.getElementById('step4') && !document.getElementById('step4').classList.contains('hidden')) {
                validateStep(4);
            }
        };
        elements.usecaseName.addEventListener('input', validateStep4);
        elements.usecaseTag.addEventListener('input', validateStep4);
    }

    // Bouton de création/modification
    if (elements.createUseCaseBtn) {
        elements.createUseCaseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            submitUseCase();
        });
    }

    // Confirmation de suppression
    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    if (elements.cancelDeleteBtn) {
        elements.cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
    }

    // Fermeture des menus et modals
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
    });

    window.addEventListener('click', (event) => {
        if (event.target === elements.useCaseModal) closeModal();
        if (event.target === elements.confirmDeleteModal) hideDeleteConfirmation();
    });
    // Nouveaux écouteurs pour les modèles pré-entraînés
    setupFileUpload();
    
    // Validation des champs pour les modèles pré-entraînés
    const pretrainedNameInput = document.getElementById('pretrainedUsecaseName');
    const pretrainedTagInput = document.getElementById('pretrainedUsecaseTag');
    
    if (pretrainedNameInput && pretrainedTagInput) {
        const validatePretrainedStep = () => {
            const isValid = pretrainedNameInput.value.trim() && pretrainedTagInput.value.trim();
            const btn = document.querySelector('#stepPretrainedDetails button[onclick="submitPretrainedUseCase()"]');
            
            if (btn) {
                btn.disabled = !isValid;
                btn.classList.toggle('opacity-50', !isValid);
                btn.classList.toggle('cursor-not-allowed', !isValid);
            }
        };
        
        pretrainedNameInput.addEventListener('input', validatePretrainedStep);
        pretrainedTagInput.addEventListener('input', validatePretrainedStep);
    }
// Écouteur pour la sélection de colonne cible (flux pré-entraîné)
    const pretrainedTargetSelect = document.getElementById("pretrainedTargetColumnSelect");
    if (pretrainedTargetSelect) {
        pretrainedTargetSelect.addEventListener('change', () => {
            validatePretrainedTargetStep();
        });
    }

    // Écouteur pour la classe positive (flux pré-entraîné)
    const pretrainedPositiveSelect = document.getElementById("pretrainedPositiveClassSelect");
    if (pretrainedPositiveSelect) {
        pretrainedPositiveSelect.addEventListener('change', () => {
            validatePretrainedTargetStep();
        });
    }
}

// Modifiez la fonction validatePretrainedTargetStep
function validatePretrainedTargetStep() {
    const targetSelect = document.getElementById("pretrainedTargetColumnSelect");
    const transformerSelect = document.getElementById("pretrainedTransformerSelect");
    const btn = document.getElementById("stepPretrainedTargetNextBtn");
    
    if (!targetSelect || !transformerSelect || !btn) return;
    
    let isValid = targetSelect.value !== "" && transformerSelect.value !== "";
    
    // Pour la classification binaire, vérifier aussi la classe positive
    if (selectedTask === 'binary') {
        const positiveSelect = document.getElementById("pretrainedPositiveClassSelect");
        isValid = isValid && positiveSelect && positiveSelect.value !== "";
    }
    
    btn.disabled = !isValid;
    btn.classList.toggle('opacity-50', !isValid);
    btn.classList.toggle('cursor-not-allowed', !isValid);
}

// Ajoutez un écouteur pour le selecteur de transformation
const pretrainedTransformerSelect = document.getElementById("pretrainedTransformerSelect");
if (pretrainedTransformerSelect) {
    pretrainedTransformerSelect.addEventListener('change', () => {
        validatePretrainedTargetStep();
    });
}

// Modifiez handlePretrainedTargetColumnChange pour inclure la validation
async function handlePretrainedTargetColumnChange() {
    const select = document.getElementById("pretrainedTargetColumnSelect");
    const positiveContainer = document.getElementById("pretrainedPositiveClassContainer");
    const positiveSelect = document.getElementById("pretrainedPositiveClassSelect");
    
    if (!select || !positiveContainer || !positiveSelect) return;
    
    const column = select.value;
    if (!column) {
        positiveContainer.classList.add("hidden");
        validatePretrainedTargetStep();
        return;
    }

    positiveSelect.innerHTML = '<option value="">Chargement...</option>';
    
    try {
        const response = await fetch(`/data_set/get_column_values?filename=${encodeURIComponent(filename)}&column=${encodeURIComponent(column)}`);
        if (!response.ok) throw new Error(await response.text());
        
        const values = await response.json();
        positiveSelect.innerHTML = '<option value="">Sélectionnez la classe positive</option>';
        values.forEach(v => {
            positiveSelect.innerHTML += `<option value="${v}">${v}</option>`;
        });
        
        if (selectedTask === 'binary') {
            positiveContainer.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Erreur:", err);
        positiveSelect.innerHTML = `<option value="">Erreur: ${err.message}</option>`;
        positiveContainer.classList.add("hidden");
    } finally {
        validatePretrainedTargetStep();
    }
}

// Initialisation
document.addEventListener("DOMContentLoaded", function() {
    initEventListeners();
    loadUseCases();
});
/**
 * Gère la suppression d'un use case
 */
function handleDeleteClick(useCaseId, event) {
    event.preventDefault();
    event.stopPropagation();
    showDeleteConfirmation(useCaseId);
}
// Fonction de recherche
function searchUseCases() {
    const searchTerm = document.querySelector('.search-container input').value.toLowerCase();
    const useCases = document.querySelectorAll('#useCasesList > div');
    
    useCases.forEach(useCase => {
        const name = useCase.querySelector('h4').textContent.toLowerCase();
        const description = useCase.querySelector('p').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            useCase.style.display = 'block';
        } else {
            useCase.style.display = 'none';
        }
    });
}
// Fonction pour mettre à jour le breadcrumb
function updateBreadcrumb(useCaseName) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;
    
    const filename = document.getElementById('app-data')?.dataset.filename;
    if (!filename) return;
    
    breadcrumb.innerHTML = `
        <a href="${window.location.pathname}?filename=${encodeURIComponent(filename)}" class="text-blue-600 hover:underline">${filename}</a>
        <i class="fas fa-chevron-right mx-2 text-gray-500"></i>
        <span class="font-semibold text-gray-800">${useCaseName}</span>
    `;
}
let creationType = null; // 'from_scratch' ou 'pretrained'
let selectedModel = null;

function selectCreationType(type) {
    creationType = type;
    document.getElementById('step1NextBtn').disabled = false;
    document.getElementById('step1NextBtn').classList.remove('opacity-50', 'cursor-not-allowed');
    
    // Mettre en évidence l'option sélectionnée
    document.querySelectorAll('#step1 > div > div').forEach(div => {
        div.classList.remove('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
    });
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
}

function handleStep1Next() {
    if (!creationType) return;
    
    if (creationType === 'from_scratch') {
        goToStep(2); // Flux normal
    } else if (creationType === 'pretrained') {
        goToStep('pretrained'); // Nouveau flux pour modèles pré-entraînés
    }
}

function selectModel(event, model) {
    selectedModel = model;
    uploadedModelFile = null;
    
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.remove('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
    });
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
    
    // Activer le bouton Suivant
    document.getElementById('stepPretrainedNextBtn').disabled = false;
    document.getElementById('stepPretrainedNextBtn').classList.remove('opacity-50', 'cursor-not-allowed');
}

// Soumission du modèle pré-entraîné
async function submitPretrainedUseCase() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    const btn = document.querySelector('#stepPretrainedDetails button[onclick="submitPretrainedUseCase()"]');
    btn.disabled = true;
    
    const useCaseData = {
        usecase_name: document.getElementById('pretrainedUsecaseName').value.trim(),
        usecase_tag: document.getElementById('pretrainedUsecaseTag').value.trim(),
        usecase_description: document.getElementById('pretrainedUsecaseDescription').value.trim(),
        dataset: filename,
        task_type: 'pretrained',
        target_column: document.getElementById('pretrainedTargetColumnSelect').value.trim(),  // Ajoutez ceci         
        pretrained_model: selectedModel || uploadedModelFile?.name
    };

    try {
        // Si un fichier a été uploadé, nous devons l'envoyer via FormData
        let response;
        if (uploadedModelFile) {
            const formData = new FormData();
            formData.append('model_file', uploadedModelFile);
            formData.append('data', JSON.stringify(useCaseData));
            
            response = await fetch('/use_case/create_pretrained_usecase', {
                method: 'POST',
                body: formData
            });
        } else {
            response = await fetch('/use_case/create_usecase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(useCaseData)
            });
        }

        if (!response.ok) throw new Error(await response.text());
        
        const result = await response.json();
        loadUseCases();
        closeModal();
        
        showNotification('Cas créé avec succès', 'success');
        
        // Réinitialiser les champs
        document.getElementById('pretrainedUsecaseName').value = '';
        document.getElementById('pretrainedUsecaseTag').value = '';
        document.getElementById('pretrainedUsecaseDescription').value = '';
        selectedModel = null;
        uploadedModelFile = null;
        creationType = null;
        
        // Réinitialiser la zone de dépôt
        const dropZone = document.getElementById('dropZone');
        dropZone.innerHTML = `
            <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-upload text-gray-400 text-xl"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Déposer votre fichier ici</h3>
            <p class="mt-1 text-sm text-gray-500">ou cliquez pour parcourir</p>
            <p class="mt-2 text-xs text-gray-500">Formats supportés: .joblib, .h5, .pkl, .pb</p>
        `;
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
        isSubmitting = false;
        btn.disabled = false;
    }
}
// Gestion du drag and drop et de l'upload de fichier
function setupFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('modelFileInput');
    
    if (!dropZone || !fileInput) return;
    
    // Gestion du drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // Gestion du clic
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });
}
function handleFileUpload(file) {
    const validExtensions = ['.joblib', '.h5', '.pkl', '.pb'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
        showNotification('Format de fichier non supporté. Utilisez .joblib, .h5, .pkl ou .pb', 'error');
        return;
    }
    
    // Désélectionner tout modèle existant
    selectedModel = null;
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.remove('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-200');
    });
    
    uploadedModelFile = file;
    
    // Mettre à jour l'UI
    const dropZone = document.getElementById('dropZone');
    dropZone.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-file-alt text-gray-500 mr-3"></i>
                <span>${file.name}</span>
            </div>
            <span class="text-green-500 text-sm">Prêt</span>
        </div>
    `;
    
    // Activer le bouton Suivant de l'étape modèle pré-entraîné
    const nextBtn = document.getElementById('stepPretrainedModelNextBtn');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
//Ajoutez la fonction pour charger les colonnes cibles dans le flux pré-entraîné :
async function loadPretrainedTargetColumns() {
    const select = document.getElementById("pretrainedTargetColumnSelect");
    if (!select || !filename) return;
    
    select.innerHTML = '<option value="">Chargement...</option>';

    try {
        const response = await fetch(`/data_set/get_string_columns?filename=${encodeURIComponent(filename)}`);
        if (!response.ok) throw new Error(await response.text());
        
        const columns = await response.json();
        select.innerHTML = '<option value="">-- Sélectionnez une colonne --</option>';
        
        if (columns.length === 0) {
            select.innerHTML += '<option value="" disabled>Aucune colonne valide trouvée</option>';
        } else {
            columns.forEach(col => {
                select.innerHTML += `<option value="${col}">${col}</option>`;
            });
        }
    } catch (error) {
        console.error("Erreur:", error);
        select.innerHTML = `<option value="">Erreur: ${error.message}</option>`;
    }
}

//Ajoutez la fonction pour gérer le changement de colonne cible dans le flux pré-entraîné :

async function handlePretrainedTargetColumnChange() {
    const select = document.getElementById("pretrainedTargetColumnSelect");
    const positiveContainer = document.getElementById("pretrainedPositiveClassContainer");
    const positiveSelect = document.getElementById("pretrainedPositiveClassSelect");
    
    if (!select || !positiveContainer || !positiveSelect) return;
    
    const column = select.value;
    if (!column) {
        positiveContainer.classList.add("hidden");
        return;
    }

    positiveSelect.innerHTML = '<option value="">Chargement...</option>';
    
    try {
        const response = await fetch(`/data_set/get_column_values?filename=${encodeURIComponent(filename)}&column=${encodeURIComponent(column)}`);
        if (!response.ok) throw new Error(await response.text());
        
        const values = await response.json();
        positiveSelect.innerHTML = '<option value="">Sélectionnez la classe positive</option>';
        values.forEach(v => {
            positiveSelect.innerHTML += `<option value="${v}">${v}</option>`;
        });
        
        if (selectedTask === 'binary') {
            positiveContainer.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Erreur:", err);
        positiveSelect.innerHTML = `<option value="">Erreur: ${err.message}</option>`;
        positiveContainer.classList.add("hidden");
    }
}