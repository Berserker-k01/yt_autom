import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import './Login.css';

// Détecter l'environnement
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
    ? (process.env.REACT_APP_API_URL || 'https://yt-autom.onrender.com')
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            console.log('Tentative d\'inscription avec:', { email: formData.email, name: formData.name });
            
            const response = await axios.post(
                `${API_URL}/api/auth/register`,
                {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                },
                {
                    timeout: 10000, // 10 secondes de timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Réponse du serveur:', response.data);

            // Vérifier que la réponse contient les tokens
            if (response.data.access_token && response.data.user) {
                // Store tokens
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token || '');
                localStorage.setItem('user', JSON.stringify(response.data.user));

                console.log('Compte créé avec succès, redirection...');
                
                // Redirect to dashboard
                navigate('/dashboard');
            } else {
                throw new Error('Réponse du serveur invalide');
            }
        } catch (err) {
            console.error('Erreur lors de l\'inscription:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError('La requête a pris trop de temps. Vérifiez votre connexion internet.');
            } else if (err.response) {
                // Le serveur a répondu avec un code d'erreur
                const errorMessage = err.response.data?.error || err.response.data?.message || 'Erreur lors de l\'inscription';
                setError(errorMessage);
                console.error('Erreur serveur:', err.response.status, errorMessage);
            } else if (err.request) {
                // La requête a été faite mais aucune réponse n'a été reçue
                setError('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
                console.error('Pas de réponse du serveur:', err.request);
            } else {
                // Erreur lors de la configuration de la requête
                setError('Erreur lors de la création du compte. Veuillez réessayer.');
                console.error('Erreur de configuration:', err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card glass-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
                    <h1>Créer un compte</h1>
                    <p className="auth-subtitle">Commencez à créer des scripts viraux dès aujourd'hui</p>
                </div>

                {error && (
                    <motion.div
                        className="error-message"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nom</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Votre nom"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min. 8 caractères"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirmer le mot de passe"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Création du compte...' : 'Créer mon compte'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Vous avez déjà un compte ? <Link to="/login">Se connecter</Link></p>
                </div>
            </motion.div>
        </div>
    );
}

export default Register;
