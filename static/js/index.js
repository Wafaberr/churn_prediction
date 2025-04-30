
        window.onload = function() {
            var toastElList = [].slice.call(document.querySelectorAll('.toast'));
            var toastList = toastElList.map(function(toastEl) {
                var option = {
                    delay: 3000
                };
                var myToast = new bootstrap.Toast(toastEl, option);
                myToast.show();
            });
        };

        document.addEventListener('DOMContentLoaded', function () {
            const toastElList = [].slice.call(document.querySelectorAll('.toast'));
            const toastList = toastElList.map(function (toastEl) {
                return new bootstrap.Toast(toastEl);
            });
            toastList.forEach(toast => toast.show());
        });

        // Gestion de l'affichage des panneaux
        const signUpBtn = document.getElementById('signUp');
        const signInBtn = document.getElementById('signIn');
        const container = document.getElementById('container');

        signUpBtn.addEventListener('click', () => {
            container.classList.add('right-panel-active');
        });

        signInBtn.addEventListener('click', () => {
            container.classList.remove('right-panel-active');
        });
    