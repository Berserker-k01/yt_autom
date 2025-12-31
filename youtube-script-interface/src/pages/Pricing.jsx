import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheck, FaStar, FaUsers, FaShieldAlt, FaMobileAlt, FaArrowRight } from 'react-icons/fa';
import MobileMoneyPayment from '../components/payment/MobileMoneyPayment';
import { useAuth } from '../context/AuthContext';
import './Pricing.css';

function Pricing() {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = (plan) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    navigate('/dashboard');
  };

  const benefits = [
    'Génération instantanée de scripts',
    'Optimisation multi-plateformes',
    'Support prioritaire',
    'Export PDF professionnel',
    'Analytics avancés'
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pricing-header"
        >
          <h1>Tarifs Transparents</h1>
          <p className="header-subtitle">Choisissez le plan qui correspond à vos besoins</p>
          <motion.div
            className="payment-method-badge"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FaMobileAlt /> Paiement par Mobile Money (Orange, MTN, M-Pesa, etc.)
          </motion.div>
          <div className="trust-indicators">
            <div className="trust-item">
              <FaUsers /> 500+ créateurs actifs
            </div>
            <div className="trust-item">
              <FaShieldAlt /> Paiement sécurisé
            </div>
            <div className="trust-item">
              <FaStar /> 4.9/5 satisfaction
            </div>
          </div>
        </motion.div>

        <div className="pricing-grid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="pricing-card glass-card"
          >
            <h3>Gratuit</h3>
            <div className="price">
              0 FCFA<span>/mois</span>
            </div>
            <ul>
              <li><FaCheck /> 5 scripts/mois</li>
              <li><FaCheck /> YouTube uniquement</li>
              <li><FaCheck /> Exports basiques</li>
              <li><FaCheck /> Support communautaire</li>
            </ul>
            {isAuthenticated ? (
              <button className="btn-secondary" disabled>
                Plan actuel
              </button>
            ) : (
              <Link to="/register" className="btn-secondary">
                Commencer
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pricing-card glass-card featured"
          >
            <div className="badge">Le Plus Populaire</div>
            <h3>Pro</h3>
            <div className="price">
              12 000 FCFA<span>/mois</span>
            </div>
            <ul>
              <li><FaCheck /> 100 scripts/mois</li>
              <li><FaCheck /> Toutes les plateformes</li>
              <li><FaCheck /> Templates premium</li>
              <li><FaCheck /> Support prioritaire</li>
              <li><FaCheck /> Export PDF avancé</li>
              <li><FaCheck /> Analytics détaillés</li>
            </ul>
            <button
              className="btn-primary"
              onClick={() => handleSelectPlan('pro')}
            >
              S'abonner maintenant
              <FaArrowRight className="btn-icon" />
            </button>
            <div className="popular-badge">Le choix de 80% des créateurs</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pricing-card glass-card"
          >
            <h3>Enterprise</h3>
            <div className="price">
              60 000 FCFA<span>/mois</span>
            </div>
            <ul>
              <li><FaCheck /> Scripts illimités</li>
              <li><FaCheck /> Accès API complet</li>
              <li><FaCheck /> Workflows personnalisés</li>
              <li><FaCheck /> Support dédié 24/7</li>
              <li><FaCheck /> Analytics avancés</li>
              <li><FaCheck /> Intégrations personnalisées</li>
            </ul>
            <button
              className="btn-secondary"
              onClick={() => handleSelectPlan('enterprise')}
            >
              S'abonner
            </button>
          </motion.div>
        </div>

        <motion.div
          className="pricing-benefits"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Tous les plans incluent</h2>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="benefit-item"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FaCheck className="benefit-icon" />
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="pricing-faq"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Questions Fréquentes</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Quels opérateurs Mobile Money sont supportés ?</h4>
              <p>
                Nous supportons Orange Money, MTN Mobile Money, M-Pesa, Airtel Money,
                Moov Money et bien d'autres selon votre pays. Le paiement est instantané et sécurisé.
              </p>
            </div>
            <div className="faq-item">
              <h4>Comment fonctionne le paiement ?</h4>
              <p>
                Vous recevrez une demande de paiement sur votre téléphone. Confirmez
                simplement le paiement et votre abonnement sera activé immédiatement.
                Aucune carte bancaire requise !
              </p>
            </div>
            <div className="faq-item">
              <h4>Puis-je annuler mon abonnement ?</h4>
              <p>
                Oui, vous pouvez annuler votre abonnement à tout moment depuis votre
                tableau de bord. Vous continuerez à bénéficier des fonctionnalités
                jusqu'à la fin de la période payée.
              </p>
            </div>
            <div className="faq-item">
              <h4>Y a-t-il un essai gratuit ?</h4>
              <p>
                Oui ! Le plan gratuit vous permet de tester toutes les fonctionnalités
                avec 5 scripts par mois. Aucune carte bancaire requise.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {showPayment && (
        <MobileMoneyPayment
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

export default Pricing;

