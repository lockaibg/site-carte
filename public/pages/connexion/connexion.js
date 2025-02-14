
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const messageDiv = document.getElementById('login-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userName = document.getElementById('user-name').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const response = await fetch('/utilisateur.json');
            if (!response.ok) {
                throw new Error("Impossible de charger les données utilisateurs.");
            }

            const users = await response.json();

            const matchedUser = users.find(user => user.name === userName && user.password === password);

            if (matchedUser) {
                messageDiv.textContent = `Bienvenue, ${matchedUser.name} !`;
                messageDiv.style.color = "green";

                setTimeout(() => {
                    localStorage.setItem('userCode', matchedUser.code);
                    window.location.href = `../commencer/commencer.html?code=${matchedUser.code}`;
                }, 2000);
            } else {
                messageDiv.textContent = "Code ou mot de passe incorrect.";
                messageDiv.style.color = "red";
            }
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
            messageDiv.textContent = "Erreur lors de la connexion. Veuillez réessayer.";
            messageDiv.style.color = "red";
        }
    });
});
