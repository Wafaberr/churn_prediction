// Variables globales
let currentChart = null;
let currentChartData = null;
let currentColumnName = '';

// Initialisation des icônes Feather
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    moveTab(0); // Afficher PREVIEW par défaut
});

// Fonction pour changer d'onglet
function moveTab(index) {
    // Animation de l'indicateur glissant
    const tabs = document.querySelectorAll('.tab-button');
    const indicator = document.querySelector('.tab-indicator');
    const tabWidth = tabs[index].offsetWidth;
    
    indicator.style.width = `${tabWidth}px`;
    indicator.style.transform = `translateX(${tabs[index].offsetLeft - tabs[0].offsetLeft}px)`;
    
    // Changement de couleur pour les onglets
    tabs.forEach((tab, idx) => {
        if (idx === index) {
            tab.classList.remove('inactive');
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
            tab.classList.add('inactive');
        }
    });

    // Affichage des sections
    document.getElementById('preview-section').classList.toggle('hidden', index !== 0);
    document.getElementById('schema-section').classList.toggle('hidden', index !== 1);
    document.getElementById('statistics-section').classList.toggle('hidden', index !== 2);
    
    // Mise à jour des icônes
    setTimeout(() => feather.replace(), 10);
}

// Fonction de filtrage des colonnes
function filterColumns(searchTerm) {
    const columns = document.querySelectorAll('.column-card');
    const searchLower = searchTerm.toLowerCase();
    
    columns.forEach(column => {
        const columnName = column.querySelector('h3').textContent.toLowerCase();
        if (columnName.includes(searchLower)) {
            column.style.display = 'block';
        } else {
            column.style.display = 'none';
        }
    });
}

// Fonction pour afficher le modal avec le diagramme
async function showColumnChart(columnName,filename) {
    const modal = document.getElementById('chartModal');
    const modalTitle = document.getElementById('modalTitle');
    const chartCanvas = document.getElementById('columnChart');
    const statsSummary = document.getElementById('statsSummary');
    
    currentColumnName = columnName;
    
    // Afficher un indicateur de chargement
    modalTitle.textContent = `Chargement des données pour ${columnName}...`;
    statsSummary.innerHTML = '<div class="col-span-3 text-center py-4">Chargement en cours...</div>';
    modal.style.display = 'block';
    
    try {
        // Récupérer les données depuis le serveur
        
        const response = await fetch(`/data_set/get_column_data/${(filename)}/${encodeURIComponent(columnName)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des données');
        }
        
        // Sauvegarder les données pour les changements de type de graphique
        currentChartData = data;
        
        // Mettre à jour le titre du modal
        modalTitle.textContent = `${columnName} (${data.type})`;
        
        // Afficher les statistiques résumées
        updateStatsSummary(data.stats);
        
        // Créer le graphique initial
        createChart(data, 'bar');
        
    } catch (error) {
        console.error('Erreur:', error);
        modalTitle.textContent = `Erreur: ${error.message}`;
        statsSummary.innerHTML = `<div class="col-span-3 text-center py-4 text-red-500">${error.message}</div>`;
    }
}

// Fonction pour créer ou mettre à jour le graphique
function createChart(data, chartType = 'bar') {
    const chartCanvas = document.getElementById('columnChart');
    
    // Détruire le graphique précédent s'il existe
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Options communes
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== undefined) {
                            label += context.parsed.y;
                        } else {
                            label += context.parsed;
                        }
                        return label;
                    }
                }
            }
        }
    };
    
    // Options spécifiques au type de graphique
    let chartConfig;
    const isNumeric = data.type.includes('float') || data.type.includes('int');
    
    if (chartType === 'pie' || chartType === 'doughnut') {
        chartConfig = {
            type: chartType,
            data: {
                labels: data.data.labels.slice(0, 10),
                datasets: [{
                    label: currentColumnName,
                    data: data.data.values.slice(0, 10),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(236, 72, 153, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(20, 184, 166, 0.7)',
                        'rgba(249, 115, 22, 0.7)',
                        'rgba(244, 63, 94, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(6, 182, 212, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        display: true,
                        text: `Répartition de ${currentColumnName}`
                    }
                }
            }
        };
    } else if (chartType === 'line') {
        chartConfig = {
            type: 'line',
            data: {
                labels: data.data.labels,
                datasets: [{
                    label: currentColumnName,
                    data: data.data.values,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        display: true,
                        text: `Tendance de ${currentColumnName}`
                    }
                },
                scales: {
                    y: { beginAtZero: !isNumeric }
                }
            }
        };
    } else { // bar par défaut
        chartConfig = {
            type: 'bar',
            data: {
                labels: data.data.labels,
                datasets: [{
                    label: currentColumnName,
                    data: data.data.values,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        display: true,
                        text: `Distribution de ${currentColumnName}`
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        };
    }
    
    currentChart = new Chart(chartCanvas, chartConfig);
}

// Fonction pour mettre à jour le résumé des statistiques
function updateStatsSummary(stats) {
    const statsSummary = document.getElementById('statsSummary');
    let html = '';
    
    if (stats.mean !== undefined) {
        html += `
            <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-medium text-blue-800">Moyenne</h3>
                <p class="text-2xl font-bold mt-1 text-blue-600">${stats.mean.toFixed(2)}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="font-medium text-green-800">Médiane</h3>
                <p class="text-2xl font-bold mt-1 text-green-600">${stats.median.toFixed(2)}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="font-medium text-purple-800">Écart-type</h3>
                <p class="text-2xl font-bold mt-1 text-purple-600">${stats.std.toFixed(2)}</p>
            </div>
        `;
    } else {
        html += `
            <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-medium text-blue-800">Valeurs uniques</h3>
                <p class="text-2xl font-bold mt-1 text-blue-600">${stats.unique}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="font-medium text-green-800">Valeurs manquantes</h3>
                <p class="text-2xl font-bold mt-1 text-green-600">${stats.missing}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="font-medium text-purple-800">Valeur la plus fréquente</h3>
                <p class="text-xl font-bold mt-1 text-purple-600 truncate">${stats.top_value || 'N/A'}</p>
            </div>
        `;
    }
    
    statsSummary.innerHTML = html;
}

// Fonction pour changer le type de graphique
function changeChartType(type) {
    if (!currentChartData) return;
    
    // Mettre à jour l'état des boutons
    const buttons = document.querySelectorAll('#chartTypeButtons button');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase() === type) {
            btn.classList.remove('bg-gray-100', 'text-gray-800');
            btn.classList.add('bg-blue-100', 'text-blue-800');
        } else {
            btn.classList.remove('bg-blue-100', 'text-blue-800');
            btn.classList.add('bg-gray-100', 'text-gray-800');
        }
    });
    
    createChart(currentChartData, type);
}

// Fonction pour fermer le modal
function closeModal() {
    document.getElementById('chartModal').style.display = 'none';
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    currentChartData = null;
}

// Fermer le modal si on clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('chartModal');
    if (event.target == modal) {
        closeModal();
    }
}