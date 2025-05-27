SOLUTIONS_MAPPING = {
    'Raisons financières': {
        'solutions': [
            "Échelonnement des paiements: Étaler les impayés sans frais",
            "Forfait solidaire: Proposer une option low-cost temporaire",
            "Détection précoce: Alerter sur les retards de paiement",
            "Réduction temporaire: Offrir un rabais de 3 mois"
        ],
        'base_effectiveness': (75, 85)
    },
    'Déménagement / Zone non équipée': {
        'solutions': [
            "Partenariats locaux: Collaborer avec des opérateurs locaux",
            "Bon de réduction: Offrir un bon pour réabonnement si retour",
            "Service de relocation: Aide à la recherche d'options alternatives",
            "Option suspension: Suspendre le contrat pendant 6 mois"
        ],
        'base_effectiveness': (65, 80)
    },
    'Modem défectueux (FTTH)': {
        'solutions': [
            "Remplacement express: Livraison en 24h avec installation guidée",
            "Dépannage gratuit: Envoi d'un technicien sous 48h",
            "Diagnostic proactif: Détecter les pannes à distance",
            "Compensation: Offrir un mois gratuit après réparation"
        ],
        'base_effectiveness': (85, 95)
    },
    'Cas de décès': {
        'solutions': [
            "Transfert de contrat: Proposer à la famille de transférer le contrat",
            "Assistance administrative: Aider dans les démarches de clôture",
            "Option bénéficiaire: Permettre de désigner un bénéficiaire",
            "Clôture simplifiée: Processus accéléré sans frais"
        ],
        'base_effectiveness': (50, 65)
    },
    'Pas besoin': {
        'solutions': [
            "Enquête de satisfaction: Appel pour comprendre la cause réelle",
            "Offre de fidélisation: Remise immédiate ou service gratuit",
            "Pause service: Option de suspension temporaire",
            "Personnalisation: Adapter l'offre aux nouveaux besoins"
        ],
        'base_effectiveness': (55, 70)
    },
    'Possède une autre ligne': {
        'solutions': [
            "Analyse comparative: Montrer les avantages de notre offre",
            "Fusion de lignes: Proposer un forfait groupé plus avantageux",
            "Rachat de contrat: Prendre en charge les frais de résiliation concurrent",
            "Bonus fidélité: Offrir des avantages exclusifs"
        ],
        'base_effectiveness': (65, 80)
    },
    'Radiation du registre de commerce (KMS)': {
        'solutions': [
            "Transfert vers particulier: Convertir le contrat en offre personnelle",
            "Clôture simplifiée: Processus accéléré sans paperasse",
            "Archivage des données: Conserver les données 6 mois gratuitement",
            "Offre de reprise: Conditions spéciales en cas de nouvelle inscription"
        ],
        'base_effectiveness': (40, 60)
    },
    'Suite à un dérangement répétitif / Problème de qualité de service': {
        'solutions': [
            "Équipe dédiée: Créer un groupe de résolution prioritaire",
            "Compensation: Offrir des crédits ou mois gratuits",
            "Contrôle qualité renforcé: Visites techniques préventives",
            "Transparence: Fournir un rapport détaillé des corrections"
        ],
        'base_effectiveness': (75, 90)
    },
    'Saturation réseau (satisfaction d\'autres clients)': {
        'solutions': [
            "Amélioration infrastructure: Planifier les travaux d'extension",
            "Débit garanti: Offrir une QoS premium temporaire",
            "Zones prioritaires: Créer des zones de service garantie",
            "Bonus patience: Compensation pour les clients affectés"
        ],
        'base_effectiveness': (70, 85)
    },
    'Non': {
        'solutions': [
            "Programme fidélité: Renforcer la rétention des clients satisfaits",
            "Enquête proactive: Identifier les besoins non exprimés",
            "Offre préventive: Proposer des améliorations avant demande",
            "Service premium: Accès prioritaire au support"
        ],
        'base_effectiveness': (85, 95)
    },
    'default': {
        'solutions': [
            "Analyse personnalisée requise",
            "Contacter le client pour comprendre la situation",
            "Solution sur mesure à développer"
        ],
        'base_effectiveness': (50, 50)
    }
}
function getReasonBadgeClass(reason) {
    const classes = {
        'Raisons financières': 'bg-danger',
        'Déménagement / Zone non équipée': 'bg-warning',
        'Modem défectueux (FTTH)': 'bg-primary',
        'Cas de décès': 'bg-secondary',
        'Pas besoin': 'bg-success',
        'Possède une autre ligne': 'bg-info',
        'Radiation du registre de commerce (KMS)': 'bg-dark',
        'Suite à un dérangement répétitif / Problème de qualité de service': 'bg-orange',
        'Saturation réseau (satisfaction d\'autres clients)': 'bg-teal',
        'Autre': 'bg-secondary'
    };
    return classes[reason] || 'bg-secondary';
}

function renderPieChart(elementId, data, title) {
    const ctx = document.getElementById(elementId).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: data.map(item => item.color || '#3498db')
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            }
        }
    });
}

function renderLineChart(elementId, data, title) {
    const ctx = document.getElementById(elementId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.month),
            datasets: [{
                label: 'Nombre de résiliations',
                data: data.map(item => item.value),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            }
        }
    });
}

function renderSolutionsData(solutionsData) {
    const accordion = document.getElementById('solutions-accordion');
    accordion.innerHTML = '';

    solutionsData.forEach((item, index) => {
        if (!item.reason || !item.solutions || !item.effectiveness) {
            console.warn('Données de solution incomplètes:', item);
            return;
        }

        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        accordionItem.innerHTML = `
            <h2 class="accordion-header" id="heading${index}">
                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#collapse${index}" 
                        aria-expanded="${index === 0 ? 'true' : 'false'}" 
                        aria-controls="collapse${index}">
                    <span class="badge ${getReasonBadgeClass(item.reason)} me-2">${item.reason}</span>
                    Efficacité: ${item.effectiveness}
                </button>
            </h2>
            <div id="collapse${index}" 
                 class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                 aria-labelledby="heading${index}" 
                 data-bs-parent="#solutions-accordion">
                <div class="accordion-body">
                    <ul class="list-group list-group-flush">
                        ${item.solutions.map(solution => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${solution}
                                <button class="btn btn-sm btn-outline-success apply-solution" 
                                        data-reason="${encodeURIComponent(item.reason)}"
                                        data-solution="${encodeURIComponent(solution)}">
                                    Appliquer
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        accordion.appendChild(accordionItem);
    });

    document.querySelectorAll('.apply-solution').forEach(btn => {
        btn.addEventListener('click', function() {
            const reason = decodeURIComponent(this.dataset.reason);
            const solution = decodeURIComponent(this.dataset.solution);
            applySolution(reason, solution);
        });
    });
}

function applySolution(reason, solution) {
    console.log(`Application de la solution pour ${reason}: ${solution}`);
    showToast(`Solution appliquée: ${solution}`, 'success');
}

function renderHistoryData(historyData) {
    const historyTable = document.querySelector('#history-table tbody');
    historyTable.innerHTML = '';
    
    historyData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.dataset}</td>
            <td>${item.clientsAnalyzed}</td>
            <td><span class="badge bg-success">${item.results}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-history" data-id="${item.id}">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </td>
        `;
        historyTable.appendChild(row);
    });
}

function renderAnalysisData(data) {
    renderPieChart('reason-chart', data.reasons, 'Répartition des motifs de résiliation');
    renderLineChart('trend-chart', data.trend, 'Tendance des résiliations par mois');
    
    const clientsTable = document.querySelector('#clients-table tbody');
    clientsTable.innerHTML = '';
    
    data.clients.forEach(client => {
        const probValue = parseFloat(client.probability.replace('%', ''));
        
        const row = document.createElement('tr');
        row.dataset.id = client.id;
        row.innerHTML = `
            <td>${client.id}</td>
            <td><span class="badge ${getReasonBadgeClass(client.reason)}">${client.reason}</span></td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${getRiskClass(client.risk)}" 
                         role="progressbar" 
                         style="width: ${probValue}%" 
                         aria-valuenow="${probValue}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${client.probability}
                    </div>
                </div>
            </td>
            <td>${client.predicted}</td>  <!-- Nouvelle colonne -->
            <td>${client.tenure}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-client" data-id="${client.id}">
                    <i class="fas fa-eye"></i> Voir
                </button>
                <button class="btn btn-sm btn-outline-info explain-ai" data-id="${client.id}">
                    <i class="fas fa-brain"></i> AI
                </button>
            </td>
        `;
        clientsTable.appendChild(row);
    });
    
    document.querySelectorAll('.view-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.dataset.id;
            fetchClientDetails(clientId);
        });
    });
    
    document.querySelectorAll('.explain-ai').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.dataset.id;
            fetchShapExplanation(clientId);
        });
    });

    renderSolutionsData(data.solutions);
    
    const historyData = generateHistoryData();
    renderHistoryData(historyData);
//     // Ajouter un bouton de téléchargement de modèle
// const downloadBtn = document.createElement('button');
// downloadBtn.className = 'btn btn-primary mb-3';
// downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger le modèle';
// downloadBtn.addEventListener('click', downloadModel);

// // Insérer le bouton dans le DOM (ajustez selon votre mise en page)
// const analysisHeader = document.querySelector('#analyze-section .card-header');
// if (analysisHeader) {
//     analysisHeader.appendChild(downloadBtn);
// }
}
// Fonction pour uploader un modèle
async function uploadModel() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pkl,.h5';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('model_file', file);
        
        try {
            const response = await fetch('/resiliations/api/resiliation/upload_model', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erreur inconnue');
            
            showToast(result.success, 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast(error.message, 'error');
        }
    };
    
    fileInput.click();
}

// Modifiez la fonction downloadModel pour gérer les types
async function downloadModel() {
    // Demander le type de modèle à télécharger
    const modelType = prompt("Quel type de modèle voulez-vous télécharger? (pkl/h5)", "pkl");
    
    if (!modelType || !['pkl', 'h5'].includes(modelType.toLowerCase())) {
        showToast('Type de modèle invalide', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/resiliations/api/resiliation/download_model?type=${modelType}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur de téléchargement');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resiliation_model.${modelType}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast(`Modèle .${modelType} téléchargé avec succès`, 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast(error.message, 'error');
    }
}

// Ajoutez ces boutons dans votre interface
function addModelButtons() {
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group mb-3';
    
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn btn-primary';
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Charger modèle';
    uploadBtn.onclick = uploadModel;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-success';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger modèle';
    downloadBtn.onclick = downloadModel;
    
    btnGroup.appendChild(uploadBtn);
    btnGroup.appendChild(downloadBtn);
    
    // Ajoutez où vous voulez dans votre interface
    const container = document.getElementById('model-controls') || document.querySelector('.content-section');
    container.prepend(btnGroup);
}

// Appelez cette fonction au chargement
document.addEventListener('DOMContentLoaded', addModelButtons);
async function fetchClientDetails(clientId) {
    try {
        const response = await fetch(`/resiliations/api/resiliation/client/${clientId}`);
        if (!response.ok) {
            throw new Error('Erreur serveur');
        }
        const clientData = await response.json();
        
        // Mettre à jour les informations client dans le modal
        document.getElementById('client-info').innerHTML = `
            <tr><th>ID Client</th><td>${clientData.id}</td></tr>
            <tr><th>Nom</th><td>${clientData.name}</td></tr>
            <tr><th>Email</th><td>${clientData.email}</td></tr>
            <tr><th>Téléphone</th><td>${clientData.phone}</td></tr>
            <tr><th>Date d'adhésion</th><td>${clientData.joinDate}</td></tr>
            <tr><th>Forfait</th><td>${clientData.plan}</td></tr>
            <tr><th>Segment</th><td>${clientData.segment}</td></tr>
            <tr><th>Motif de résiliation</th><td><span class="badge ${getReasonBadgeClass(clientData.reason)}">${clientData.reason}</span></td></tr>
        `;

        // Afficher les statistiques d'utilisation et la solution principale uniquement
        document.getElementById('client-solution').innerHTML = `
            <h5>Informations supplémentaires</h5>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Ancienneté:</strong> ${clientData.stats.tenure} mois</p>
                    <p><strong>Charges mensuelles:</strong> ${clientData.stats.monthly_charges} DA</p>
                    <p><strong>Charges totales:</strong> ${clientData.stats.total_charges} DA</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Appels locaux:</strong> ${clientData.stats.usage.local_calls}</p>
                    <p><strong>Appels internationaux:</strong> ${clientData.stats.usage.international_calls}</p>
                    <p><strong>Téléchargements:</strong> ${clientData.stats.usage.download} Go/mois</p>
                </div>
            </div>
            
            <h5 class="mt-3">Analyse de risque</h5>
            <p><strong>Probabilité de résiliation:</strong> ${clientData.probability}%</p>
            <p><strong>Probabilité de rétention:</strong> ${clientData.retention_probability}%</p>
            
            <h5 class="mt-3">Solution recommandée</h5>
            <p><strong>Solution:</strong> ${clientData.solution}</p>
            <p><strong>Efficacité:</strong> ${clientData.solution_effectiveness}</p>
            <p><strong>Taux de succès estimé:</strong> ${clientData.successRate}%</p>
        `;

        // Afficher le graphique SHAP si disponible
        if (clientData.features && clientData.features.length > 0) {
            const chartContainer = document.getElementById('client-analysis-chart');
            chartContainer.innerHTML = '<canvas id="shap-chart"></canvas>';
            renderShapChart('shap-chart', clientData.features);
        }

        // Afficher le modal
        const modal = new bootstrap.Modal(document.getElementById('clientModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Échec du chargement des détails', 'error');
    }
}

async function fetchShapExplanation(clientId) {
    try {
        // Récupérer les détails du client
        const response = await fetch(`/resiliations/api/resiliation/client/${clientId}`);
        const clientData = await response.json();
        
        // Récupérer la raison de résiliation du client
        const reason = clientData.reason;
        
        // Afficher les solutions dans le modal
        const modalBody = document.querySelector('#shapModal .modal-body');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h4>Solutions pour le client ${clientId}</h4>
                    <p><strong>Motif de résiliation:</strong> <span class="badge ${getReasonBadgeClass(reason)}">${reason}</span></p>
                    
                    <h5 class="mt-4">Solutions recommandées:</h5>
                    <ul class="list-group">
                        ${SOLUTIONS_MAPPING[reason]?.solutions.map(solution => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${solution}
                                <button class="btn btn-sm btn-outline-success apply-solution">
                                    Appliquer
                                </button>
                            </li>
                        `).join('') || '<li class="list-group-item">Aucune solution trouvée pour ce motif</li>'}
                    </ul>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('shapModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching solutions:', error);
        showToast('Erreur lors du chargement des solutions', 'error');
    }
}


function renderShapChart(elementId, features) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    features.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: features.map(item => item.name),
            datasets: [{
                label: 'Impact sur la résiliation',
                data: features.map(item => item.value),
                backgroundColor: features.map(item => 
                    item.value > 0 ? '#e74c3c' : '#2ecc71')
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
                x: {
                    min: -1,
                    max: 1
                }
            }
        }
    });
}

function generateHistoryData() {
    return [{
        date: new Date().toLocaleDateString(),
        dataset: "testdata.xlsx",
        clientsAnalyzed: document.querySelectorAll('#clients-table tbody tr').length,
        results: "Completed",
        id: "analysis_" + Date.now()
    }];
}

function getRiskClass(risk) {
    const classes = {
        'high': 'bg-danger',
        'medium': 'bg-warning',
        'low': 'bg-success'
    };
    return classes[risk] || 'bg-info';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast show align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.add('d-none');
            });
            
            const target = this.dataset.target;
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.classList.remove('d-none');
            }
        });
    });

    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
        uploadSection.classList.remove('d-none');
    }
    
    const uploadBtn = document.querySelector('.nav-btn[data-target="upload-section"]');
    if (uploadBtn) {
        uploadBtn.classList.add('active');
    }
});

document.getElementById('load-dataset-btn')?.addEventListener('click', function() {
    const spinner = this.querySelector('.fa-spinner');
    if (spinner) spinner.classList.remove('d-none');
    this.disabled = true;
    
    const selectedFile = document.getElementById('dataset-select')?.value;
    const selectedModel = document.getElementById('model-select')?.value;
    
    if (!selectedFile || selectedFile !== 'testdata.xlsx') {
        showToast('Seul le dataset "testdata.xlsx" est autorisé', 'error');
        if (spinner) spinner.classList.add('d-none');
        this.disabled = false;
        return;
    }
    
    fetch('/resiliations/api/resiliation/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            filename: selectedFile,
            model_name: selectedModel  // Envoyez le modèle sélectionné
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Erreur serveur');
            });
        }
        return response.json();
    })
    .then(data => {
        if (spinner) spinner.classList.add('d-none');
        this.disabled = false;
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        renderAnalysisData(data);
        showToast('Dataset analysé avec succès!', 'success');
        
        const analyzeBtn = document.getElementById('nav-analyze');
        if (analyzeBtn) {
            analyzeBtn.click();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (spinner) spinner.classList.add('d-none');
        this.disabled = false;
        showToast(error.message || 'Erreur lors de l\'analyse du dataset', 'error');
    });
});
document.getElementById('prediction-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    const resultSection = document.querySelector('.prediction-result');
    
    // Afficher le spinner
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyse en cours...';
    resultSection.style.display = 'none';
    
    try {
        const formData = new FormData(form);
        const response = await fetch('/resiliations/predict_single', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur serveur');
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Préparer le badge de risque
        const riskClass = result.prediction === 'Oui' ? 'bg-danger' : 'bg-success';
        const riskText = result.prediction === 'Oui' ? 'Probable' : 'Peu probable';
        
        // Préparer les solutions alternatives
        let additionalSolutionsHtml = '';
        if (result.additional_solutions && result.additional_solutions.length > 0) {
            additionalSolutionsHtml = `
                <div class="mt-3">
                    <h6>Solutions alternatives</h6>
                    <ul class="list-group">
                        ${result.additional_solutions.map(sol => `
                            <li class="list-group-item">${sol}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Préparer l'explication SHAP
        let shapExplanationHtml = '';
        if (result.features && result.features.length > 0) {
            shapExplanationHtml = `
                <div class="mt-3">
                    <h6>Facteurs influents</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Facteur</th>
                                    <th>Influence</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.features.map(feat => `
                                    <tr>
                                        <td>${feat.name}</td>
                                        <td class="${feat.value > 0 ? 'text-danger' : 'text-success'}">
                                            ${feat.value > 0 ? '+' : ''}${feat.value.toFixed(2)}
                                        </td>
                                        <td>${feat.description}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        // Créer le HTML des résultats
        const resultHtml = `
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h4 class="mb-3">Résultat de la Prédiction</h4>
                    <div class="d-flex align-items-center gap-3">
                        <div style="width: 60px; height: 60px; background-color: ${result.prediction === 'Oui' ? '#e74c3c' : '#2ecc71'}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${result.prediction === 'Oui' ? 'fa-exclamation-triangle' : 'fa-check-circle'} text-white fa-2x"></i>
                        </div>
                        <div>
                            <h5 class="mb-1">Résiliation: 
                                <span class="badge ${riskClass}">
                                    ${riskText}
                                </span>
                            </h5>
                            <p class="mb-0">Probabilité: ${result.probability}%</p>
                            <p class="mb-0">Motif: ${result.reason || 'Non spécifié'}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="alert ${result.prediction === 'Oui' ? 'alert-warning' : 'alert-success'}">
                        <h5><i class="fas ${result.prediction === 'Oui' ? 'fa-lightbulb' : 'fa-thumbs-up'} me-2"></i>${result.prediction === 'Oui' ? 'Recommandation' : 'Client satisfait'}</h5>
                        ${result.prediction === 'Oui' ? `
                            <p class="mb-2">Ce client présente un risque élevé de résiliation. Voici les actions recommandées :</p>
                            <ul class="mb-0">
                                <li><strong>Solution principale:</strong> ${result.solution} (${result.effectiveness})</li>
                                <li><strong>Taux de succès estimé:</strong> ${result.success_rate}%</li>
                            </ul>
                        ` : `
                            <p class="mb-0">Ce client présente un faible risque de résiliation. Maintenez une communication régulière pour conserver sa satisfaction.</p>
                        `}
                    </div>
                </div>
            </div>
            
            ${shapExplanationHtml}
            ${additionalSolutionsHtml}
        `;
        
        // Afficher les résultats
        resultSection.innerHTML = resultHtml;
        resultSection.style.display = 'block';
        
        // Faire défiler jusqu'au résultat
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error:', error);
        
        // Afficher le message d'erreur
        resultSection.innerHTML = `
            <div class="alert alert-danger">
                <h5><i class="fas fa-exclamation-circle me-2"></i>Erreur de prédiction</h5>
                <p class="mb-0">${error.message}</p>
            </div>
        `;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});