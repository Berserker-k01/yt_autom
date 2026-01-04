import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaStar, FaArrowRight, FaYoutube, FaTiktok, FaInstagram, FaRocket, FaUsers, FaChartLine, FaGlobe } from 'react-icons/fa';
import './Landing.css';

function Landing() {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const stats = [
        { value: '10K+', label: t('stats.generated') },
        { value: '500+', label: t('stats.active_creators') },
        { value: '95%', label: t('stats.satisfaction') },
        { value: '24/7', label: t('stats.support') }
    ];

    const testimonials = [
        {
            name: 'Amadou Diallo',
            role: t('testimonials.role_yt', 'YouTube Creator'),
            image: '👨‍💼',
            text: t('testimonials.amadou', "Scripty transformed my content creation. I now generate 3 scripts a day instead of one a week!"),
            rating: 5
        },
        {
            name: 'Fatou Sarr',
            role: t('testimonials.role_tiktok', 'TikTok Influencer'),
            image: '👩‍💼',
            text: t('testimonials.fatou', "The scripts are perfectly optimized for TikTok. My views increased by 300% since I started using Scripty."),
            rating: 5
        }
    ];

    const features = [
        {
            icon: <FaRocket />,
            title: t('features.fast_gen'),
            description: t('features.fast_gen_desc')
        },
        {
            icon: <FaYoutube />,
            title: t('features.multi_platform'),
            description: t('features.multi_platform_desc')
        },
        {
            icon: <FaChartLine />,
            title: t('features.advanced_analytics'),
            description: t('features.advanced_analytics_desc')
        },
        {
            icon: <FaUsers />,
            title: t('features.total_customization'),
            description: t('features.total_customization_desc')
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
                        <div className="lang-switcher">
                            <FaGlobe className="lang-icon" />
                            <select
                                onChange={(e) => changeLanguage(e.target.value)}
                                value={i18n.language}
                                className="lang-select"
                            >
                                <option value="fr">FR</option>
                                <option value="en">EN</option>
                            </select>
                        </div>
                        <Link to="/pricing">{t('common.pricing')}</Link>
                        <Link to="/login" className="nav-login">{t('common.sign_in')}</Link>
                        <Link to="/register" className="nav-cta">{t('common.try_free')}</Link>
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
                        ✨ {t('common.new')} : {t('common.mobile_money')}
                    </motion.div>
                    <h1 className="hero-title">
                        {t('hero.title_part1')}<span className="gradient-text">{t('hero.title_gradient')}</span><br />
                        {t('hero.title_part2')}
                    </h1>
                    <p className="hero-subtitle">
                        {t('hero.subtitle')}
                    </p>
                    <div className="hero-cta">
                        <Link to="/register" className="btn-primary btn-large">
                            {t('common.try_free')}
                            <FaArrowRight className="btn-icon" />
                        </Link>
                        <Link to="/pricing" className="btn-secondary btn-large">
                            {t('common.view_pricing')}
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
                    <h2 className="section-title">{t('features.title')}</h2>
                    <p className="section-subtitle">{t('features.subtitle')}</p>
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
                    <h3>{t('platforms.optimized', 'Optimized for all platforms')}</h3>
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
                    <h2 className="section-title">{t('testimonials.title')}</h2>
                    <p className="section-subtitle">{t('testimonials.subtitle')}</p>
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
                    <h2 className="section-title">{t('pricing.title')}</h2>
                    <p className="section-subtitle">{t('pricing.subtitle')}</p>
                </motion.div>
                <div className="pricing-grid">
                    <motion.div
                        className="pricing-card glass-card"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3>{t('pricing.free')}</h3>
                        <div className="price">0 FCFA<span>{t('pricing.per_month')}</span></div>
                        <ul>
                            <li><FaCheck /> {t('pricing.scripts5')}</li>
                            <li><FaCheck /> {t('pricing.youtube_only')}</li>
                            <li><FaCheck /> {t('pricing.basic_exports')}</li>
                            <li><FaCheck /> {t('pricing.support_comm', 'Community support')}</li>
                        </ul>
                        <Link to="/register" className="btn-secondary">{t('common.get_started')}</Link>
                    </motion.div>

                    <motion.div
                        className="pricing-card glass-card featured"
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="badge">{t('pricing.most_popular')}</div>
                        <h3>{t('pricing.pro')}</h3>
                        <div className="price">12 000 FCFA<span>{t('pricing.per_month')}</span></div>
                        <ul>
                            <li><FaCheck /> {t('pricing.scripts100')}</li>
                            <li><FaCheck /> {t('pricing.all_platforms')}</li>
                            <li><FaCheck /> {t('pricing.premium_templates')}</li>
                            <li><FaCheck /> {t('pricing.priority_support')}</li>
                            <li><FaCheck /> {t('pricing.advanced_pdf')}</li>
                        </ul>
                        <Link to="/register" className="btn-primary">{t('pricing.subscribe_now')}</Link>
                    </motion.div>

                    <motion.div
                        className="pricing-card glass-card"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3>{t('pricing.enterprise')}</h3>
                        <div className="price">60 000 FCFA<span>{t('pricing.per_month')}</span></div>
                        <ul>
                            <li><FaCheck /> {t('pricing.unlimited')}</li>
                            <li><FaCheck /> {t('pricing.api_access')}</li>
                            <li><FaCheck /> {t('pricing.custom_workflows')}</li>
                            <li><FaCheck /> {t('pricing.dedicated_support')}</li>
                            <li><FaCheck /> {t('pricing.advanced_analytics')}</li>
                        </ul>
                        <Link to="/register" className="btn-secondary">{t('pricing.contact')}</Link>
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
                    <h2>{t('cta.ready')}</h2>
                    <p>{t('cta.join')}</p>
                    <Link to="/register" className="btn-primary btn-large">
                        {t('common.try_free')}
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
                        <p>{t('footer.description')}</p>
                    </div>
                    <div className="footer-section">
                        <h4>{t('footer.product')}</h4>
                        <Link to="/pricing">{t('footer.pricing', 'Pricing')}</Link>
                        <Link to="/features">{t('footer.features', 'Features')}</Link>
                    </div>
                    <div className="footer-section">
                        <h4>{t('footer.support')}</h4>
                        <Link to="/help">{t('footer.help')}</Link>
                        <Link to="/contact">{t('footer.contact')}</Link>
                    </div>
                    <div className="footer-section">
                        <h4>{t('footer.legal')}</h4>
                        <Link to="/privacy">{t('footer.privacy')}</Link>
                        <Link to="/terms">{t('footer.terms')}</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 Scripty. {t('common.all_rights_reserved')}</p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
