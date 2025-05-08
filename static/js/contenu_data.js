document.addEventListener('DOMContentLoaded', function() {
    let currentDatasetToDelete = null;

    // File dialog
    document.getElementById('uploadButton').addEventListener('click', openFileDialog);
    document.getElementById('fileInput').addEventListener('change', uploadAndDisplayFile);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.dataset-item').forEach(item => {
            const fileName = item.querySelector('.dataset-name').textContent.toLowerCase();
            item.classList.toggle('hidden', !fileName.includes(searchTerm));
        });
    });

    // Menu toggle functionality
    document.querySelectorAll('.menu-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const menuId = this.getAttribute('data-menu-id');
            toggleMenu(menuId);
        });
    });

    // View buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            fetchAndDisplay(filename);
        });
    });

    // Download buttons
    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            downloadDataset(filename);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            showDeleteConfirmation(filename);
        });
    });

    // Modal buttons
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', performDatasetDeletion);

    // Close menus when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.menu-toggle') && !event.target.closest('[id^="menu-"]')) {
            document.querySelectorAll('[id^="menu-"]').forEach(menu => menu.classList.add('hidden'));
        }
    });

    function openFileDialog() {
        document.getElementById('fileInput').click();
    }

    async function uploadAndDisplayFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const button = document.getElementById('uploadButton');
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        button.disabled = true;

        try {
            const formData = new FormData();
            formData.append('dataset', file);

            const response = await fetch('/data_set/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();
            showNotification(`Dataset "${data.filename}" uploaded successfully`, 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            showNotification(error.message, 'error');
            console.error('Upload error:', error);
        } finally {
            button.innerHTML = originalContent;
            button.disabled = false;
            event.target.value = '';
        }
    }

    async function fetchAndDisplay(filename) {
        const previewSection = document.getElementById('datasetPreview');
        previewSection.innerHTML = `
            <div class="flex justify-center items-center h-32 bg-white rounded-xl border border-gray-200">
                <i class="fas fa-spinner fa-spin text-2xl text-blue-500 mr-3"></i>
                <span>Loading ${filename}...</span>
            </div>
        `;
        previewSection.classList.remove('hidden');

        try {
            const response = await fetch(`/uploads/${filename}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to load dataset');
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            displayDataset(data, filename);
        } catch (error) {
            showNotification(error.message, 'error');
            console.error('Fetch error:', error);
            previewSection.innerHTML = `
                <div class="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    ${error.message}
                </div>
            `;
        }
    }

    function displayDataset(responseData, filename) {
        const previewSection = document.getElementById('datasetPreview');

        previewSection.innerHTML = `
            <div class="flex justify-between items-center mb-4 bg-white p-4 rounded-t-xl border-b">
                <h2 class="text-lg font-semibold text-gray-700">Dataset Preview: ${filename}</h2>
                <button id="closePreviewBtn" class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr id="tableHeader"></tr>
                    </thead>
                    <tbody id="tableBody" class="bg-white divide-y divide-gray-200"></tbody>
                </table>
            </div>
            <div class="mt-4 text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-200">
                <span id="rowCount">Showing ${Math.min(100, responseData.total_rows)} of ${responseData.total_rows} rows</span>
            </div>
        `;

        // Create table headers
        const headerRow = document.getElementById('tableHeader');
        headerRow.innerHTML = responseData.columns.map(column =>
            `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${column}</th>`
        ).join('');

        // Create table body
        const body = document.getElementById('tableBody');
        body.innerHTML = responseData.data.map(row => `
            <tr>
                ${responseData.columns.map(column => {
            let cellValue = row[column];
            if (cellValue === null || cellValue === undefined) cellValue = 'NULL';
            if (typeof cellValue === 'object') cellValue = JSON.stringify(cellValue);
            return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cellValue}</td>`;
        }).join('')}
            </tr>
        `).join('');

        // Add event listener for close button
        document.getElementById('closePreviewBtn').addEventListener('click', closePreview);
    }

    function closePreview() {
        document.getElementById('datasetPreview').classList.add('hidden');
    }

    function toggleMenu(id) {
        document.querySelectorAll('[id^="menu-"]').forEach(menu => {
            if (menu.id !== id) menu.classList.add('hidden');
        });
        document.getElementById(id).classList.toggle('hidden');
    }

    function showDeleteConfirmation(filename) {
        currentDatasetToDelete = filename;
        const modal = document.getElementById('deleteConfirmationModal');
        const message = document.getElementById('deleteModalMessage');

        message.textContent = `Are you sure you want to delete "${filename}"? This action cannot be undone.`;
        modal.classList.remove('hidden');

        setTimeout(() => {
            modal.classList.add('opacity-100');
            document.getElementById('modalContent').classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeDeleteModal() {
        const modal = document.getElementById('deleteConfirmationModal');
        const content = document.getElementById('modalContent');

        content.classList.add('scale-95', 'opacity-0');
        modal.classList.remove('opacity-100');

        setTimeout(() => {
            modal.classList.add('hidden');
            currentDatasetToDelete = null;
        }, 300);
    }

    async function performDatasetDeletion() {
        if (!currentDatasetToDelete) return;

        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        try {
            const response = await fetch(`/data_set/delete_dataset?filename=${encodeURIComponent(currentDatasetToDelete)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Delete failed');
            }

            const result = await response.json();
            showNotification(result.message || 'Dataset deleted successfully', 'success');
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Delete error:', error);
            showNotification(error.message || 'Error deleting file', 'error');
        } finally {
            closeDeleteModal();
        }
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} z-50 transition-all duration-300`;
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('opacity-0');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function downloadDataset(filename) {
        window.location.href = `/data_set/download/${filename}`;
    }
});