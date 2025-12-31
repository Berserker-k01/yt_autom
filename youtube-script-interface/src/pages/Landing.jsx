import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheck, FaStar, FaArrowRight, FaYoutube, FaTiktok, FaInstagram, FaRocket, FaUsers, FaChartLine } from 'react-icons/fa';
import './Landing.css';

function Landing() {
    const stats = [
        { value: '10K+', label: 'Scripts générés' },
        { value: '500+', label: 'Créateurs actifs' },
        { value: '95%', label: 'Satisfaction' },
        { value: '24/7', label: 'Support' }
    ];

    const testimonials = [
        {
            name: 'Amadou Diallo',
            role: 'Créateur YouTube',
            image: '👨‍💼',
            text: 'Scripty a transformé ma façon de créer du contenu. Je génère maintenant 3 scripts par jour au lieu d\'un par semaine !',
            rating: 5
        },
        {
            name: 'Fatou Sarr',
            role: 'Influenceuse TikTok',
            image: '👩‍💼',
            text: 'Les scripts sont parfaitement optimisés pour TikTok. Mes vues ont augmenté de 300% depuis que j\'utilise Scripty.',
            rating: 5
        },
        {
            name: 'Ibrahim Traoré',
            role: 'Podcasteur',
            image: '👨‍🎤',
            text: 'L\'IA comprend vraiment mon style. Les scripts sont engageants et me font gagner des heures de travail.',
            rating: 5
        }
    ];

    const features = [
        {
            icon: <FaRocket />,
            title: 'Génération Ultra-Rapide',
            description: 'Créez des scripts viraux en moins de 2 minutes grâce à l\'IA de pointe'
        },
        {
            icon: <FaYoutube />,
            title: 'Multi-Plateformes',
            description: 'Optimisé pour YouTube, TikTok, Instagram avec des formats adaptés à chaque algorithme'
        },
        {
            icon: <FaChartLine />,
            title: 'Analytics Avancés',
            description: 'Analysez le potentiel viral de vos scripts avant même de les publier'
        },
        {
            icon: <FaUsers />,
            title: 'Personnalisation Totale',
            description: 'Adaptez le style, le ton et la longueur selon votre audience et votre niche'
        }
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="logo">
                        <span className="logo-icon">🎬</span>
                        <span className="logo-text">Scripty</span>
                    </div>
                    <div className="nav-links">
                        <Link to="/pricing">Tarifs</Link>
                        <Link to="/login" className="nav-login">Connexion</Link>
                        <Link to="/register" className="nav-cta">Commencer gratuitement</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        ✨ Nouveau : Paiement Mobile Money disponible
                    </motion.div>
                    <h1 className="hero-title">
                        Créez des <span className="gradient-text">Scripts Viraux</span><br />
                        pour toutes vos plateformes
                    </h1>
                    <p className="hero-subtitle">
                        L'IA la plus avancée pour générer des scripts YouTube, TikTok & Instagram.<br />
                        <strong>Gagnez des heures</strong> de travail et <strong>multipliez vos vues</strong> par 3.
                    </p>
                    <div className="hero-cta">
                        <Link to="/register" className="btn-primary btn-large">
                            Essayer gratuitement
                            <FaArrowRight className="btn-icon" />
                        </Link>
                        <Link to="/pricing" className="btn-secondary btn-large">
                            Voir les tarifs
                        </Link>
                    </div>
                    <div className="hero-stats">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                className="stat-item"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                            >
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="features">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title">Pourquoi les créateurs choisissent Scripty</h2>
                    <p className="section-subtitle">Tout ce dont vous avez besoin pour créer du contenu qui convertit</p>
                </motion.div>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="feature-card glass-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Social Proof */}
            <section className="social-proof">
                <motion.div
                    className="platforms-showcase"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <h3>Optimisé pour toutes les plateformes</h3>
                    <div className="platforms">
                        <div className="platform-item">
                            <FaYoutube className="platform-icon youtube" />
                            <span>YouTube</span>
                        </div>
                        <div className="platform-item">
                            <FaTiktok className="platform-icon tiktok" />
                            <span>TikTok</span>
                        </div>
                        <div className="platform-item">
                            <FaInstagram className="platform-icon instagram" />
                            <span>Instagram</span>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Ce que disent nos utilisateurs</h2>
                    <p className="section-subtitle">Rejoignez des centaines de créateurs qui font confiance à Scripty</p>
                </motion.div>
                <div className="testimonials-grid">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            className="testimonial-card glass-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="testimonial-rating">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <FaStar key={i} className="star" />
                                ))}
                            </div>
                            <p className="testimonial-text">"{testimonial.text}"</p>
                            <div className="testimonial-author">
                                <div className="author-avatar">{testimonial.image}</div>
                                <div className="author-info">
                                    <div className="author-name">{testimonial.name}</div>
                                    <div className="author-role">{testimonial.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Tarifs simples et transparents</h2>
                    <p className="section-subtitle">Choisissez le plan qui correspond à vos besoins. Paiement Mobile Money disponible.</p>
                </motion.div>
                <div className="pricing-grid">
                    <motion.div
                        className="pricing-card glass-card"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3>Gratuit</h3>
                        <div className="price">0 FCFA<span>/mois</span></div>
                        <ul>
                            <li><FaCheck /> 5 scripts/mois</li>
                            <li><FaCheck /> YouTube uniquement</li>
                            <li><FaCheck /> Exports basiques</li>
                            <li><FaCheck /> Support communautaire</li>
                        </ul>
                        <Link to="/register" className="btn-secondary">Commencer</Link>
                    </motion.div>

                    <motion.div
                        className="pricing-card glass-card featured"
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="badge">Le Plus Populaire</div>
                        <h3>Pro</h3>
                        <div className="price">12 000 FCFA<span>/mois</span></div>
                        <ul>
                            <li><FaCheck /> 100 scripts/mois</li>
                            <li><FaCheck /> Toutes les plateformes</li>
                            <li><FaCheck /> Templates premium</li>
                            <li><FaCheck /> Support prioritaire</li>
                            <li><FaCheck /> Export PDF avancé</li>
                        </ul>
                        <Link to="/register" className="btn-primary">S'abonner maintenant</Link>
                    </motion.div>

                    <motion.div
                        className="pricing-card glass-card"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3>Enterprise</h3>
                        <div className="price">60 000 FCFA<span>/mois</span></div>
                        <ul>
                            <li><FaCheck /> Scripts illimités</li>
                            <li><FaCheck /> Accès API complet</li>
                            <li><FaCheck /> Workflows personnalisés</li>
                            <li><FaCheck /> Support dédié 24/7</li>
                            <li><FaCheck /> Analytics avancés</li>
                        </ul>
                        <Link to="/register" className="btn-secondary">Contacter</Link>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <motion.div
                    className="cta-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <h2>Prêt à multiplier vos vues ?</h2>
                    <p>Rejoignez des centaines de créateurs qui utilisent Scripty pour créer du contenu viral</p>
                    <Link to="/register" className="btn-primary btn-large">
                        Commencer gratuitement
                        <FaArrowRight className="btn-icon" />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <div className="logo">
                            <span className="logo-icon">🎬</span>
                            <span className="logo-text">Scripty</span>
                        </div>
                        <p>L'outil d'IA pour créer des scripts viraux sur toutes les plateformes.</p>
                    </div>
                    <div className="footer-section">
                        <h4>Produit</h4>
                        <Link to="/pricing">Tarifs</Link>
                        <Link to="/features">Fonctionnalités</Link>
                    </div>
                    <div className="footer-section">
                        <h4>Support</h4>
                        <Link to="/help">Aide</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                    <div className="footer-section">
                        <h4>Légal</h4>
                        <Link to="/privacy">Confidentialité</Link>
                        <Link to="/terms">Conditions</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 Scripty. Tous droits réservés. Construit pour les créateurs, par les créateurs.</p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
