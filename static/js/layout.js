// document.addEventListener('DOMContentLoaded', () => {
//     // Marquer l’élément actif
//     const currentPath = window.location.pathname;
//     document.querySelectorAll('.nav-link').forEach(link => {
//         if (link.getAttribute('href') === currentPath) {
//             link.classList.add('active');
//         }
//     });
// });
// document.addEventListener('DOMContentLoaded', () => {
//     // Appliquer le thème enregistré
//     const savedTheme = localStorage.getItem('theme') || 'light';
//     setTheme(savedTheme);

//     // Activer lien actif dans sidebar
//     const currentPath = window.location.pathname;
//     document.querySelectorAll('.nav-link').forEach(link => {
//         if (link.getAttribute('href') === currentPath) {
//             link.classList.add('active');
//         }
//     });

//     // Gestion du bouton de bascule
//     document.getElementById('themeToggle').addEventListener('click', () => {
//         const current = document.body.getAttribute('data-bs-theme');
//         const newTheme = current === 'dark' ? 'light' : 'dark';
//         setTheme(newTheme);
//         localStorage.setItem('theme', newTheme);
//     });

//     function setTheme(theme) {
//         document.body.setAttribute('data-bs-theme', theme);
//         const icon = document.getElementById('themeIcon');
//         icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
//     }
// });
