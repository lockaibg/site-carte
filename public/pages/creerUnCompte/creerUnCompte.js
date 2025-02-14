document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-account-form');
    const messageDiv = document.getElementById('create-account-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (password !== confirmPassword) {
            messageDiv.textContent = "Les mots de passe ne correspondent pas.";
            messageDiv.style.color = "red";
            return;
        }

        const userCode = generateRandomCode();

        try {
            const response = await fetch('/utilisateur.json');
            if (!response.ok) {
                throw new Error("Impossible de charger les utilisateurs.");
            }

            const users = await response.json();

            if (users.some(user => user.name === username)) {
                messageDiv.textContent = "Un utilisateur avec ce nom existe déjà.";
                messageDiv.style.color = "red";
                return;
            }

            const newUser = { code: userCode, password, name: username };
            users.push(newUser);

            await fetch('/saveUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(users),
            });

            messageDiv.textContent = `Compte créé avec succès ! Votre code personnel est : ${userCode}`;
            messageDiv.style.color = "green";

            setTimeout(() => {
                window.location.href = "../connexion/connexion.html";
            }, 3000);
        } catch (error) {
            console.error("Erreur lors de la création du compte :", error);
            messageDiv.textContent = "Une erreur est survenue lors de la création du compte.";
            messageDiv.style.color = "red";
        }
    });

    function generateRandomCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
});

