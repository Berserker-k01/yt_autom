import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './MobileMoneyPayment.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MobileMoneyPayment = ({ plan, onSuccess, onCancel }) => {
  const [country, setCountry] = useState('SN');
  const [providers, setProviders] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');

  const countries = [
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' }
  ];

  const providerNames = {
    'orange': 'Orange Money',
    'mtn': 'MTN Mobile Money',
    'mpesa': 'M-Pesa',
    'airtel': 'Airtel Money',
    'moov': 'Moov Money',
    'tigo': 'Tigo Cash',
    'free': 'Free Money',
    'vodafone': 'Vodafone Cash'
  };

  useEffect(() => {
    fetchProviders();
  }, [country]);

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payment/providers`, {
        params: { country }
      });
      setProviders(response.data.providers || {});
    } catch (err) {
      console.error('Erreur lors de la récupération des opérateurs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phoneNumber || !selectedProvider) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/api/payment/initiate`,
        {
          plan,
          phone_number: phoneNumber,
          provider: selectedProvider,
          country_code: country
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setTransactionRef(response.data.transaction_ref);
        setPaymentStatus('pending');
        
        // Rediriger vers la page de paiement Flutterwave ou afficher les instructions
        if (response.data.payment_link) {
          window.open(response.data.payment_link, '_blank');
        }
        
        // Vérifier périodiquement le statut du paiement
        checkPaymentStatus(response.data.transaction_ref);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'initiation du paiement');
      console.error('Erreur paiement:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (ref) => {
    const maxAttempts = 30; // 30 tentatives = 5 minutes
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_URL}/api/payment/verify/${ref}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.status === 'success') {
          setPaymentStatus('success');
          clearInterval(interval);
          setTimeout(() => {
            onSuccess && onSuccess();
          }, 2000);
        } else if (attempts >= maxAttempts) {
          setPaymentStatus('timeout');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Erreur vérification:', err);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 10000); // Vérifier toutes les 10 secondes
  };

  const planPrices = {
    pro: { amount: 12000, currency: 'XOF', name: 'Pro' },
    enterprise: { amount: 60000, currency: 'XOF', name: 'Enterprise' }
  };

  const currentPlan = planPrices[plan] || planPrices.pro;

  return (
    <div className="mobile-money-payment">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="payment-modal glass-card"
      >
        <div className="payment-header">
          <h2>Paiement Mobile Money</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="payment-summary">
          <div className="plan-info">
            <h3>Plan {currentPlan.name}</h3>
            <div className="price">
              {currentPlan.amount.toLocaleString()} {currentPlan.currency}
              <span>/mois</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {paymentStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="success-message"
            >
              <div className="success-icon">✓</div>
              <h3>Paiement confirmé !</h3>
              <p>Votre abonnement a été activé avec succès.</p>
            </motion.div>
          )}

          {paymentStatus === 'pending' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pending-message"
            >
              <div className="spinner"></div>
              <h3>En attente de confirmation</h3>
              <p>
                Veuillez confirmer le paiement sur votre téléphone.
                <br />
                <small>Vous allez recevoir une demande de paiement sur {phoneNumber}</small>
              </p>
            </motion.div>
          )}

          {paymentStatus !== 'success' && paymentStatus !== 'pending' && (
            <form onSubmit={handleSubmit} className="payment-form">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="error-message"
                >
                  {error}
                </motion.div>
              )}

              <div className="form-group">
                <label>Pays</label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setSelectedProvider('');
                  }}
                  className="form-control"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Opérateur Mobile Money</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Sélectionnez un opérateur</option>
                  {Object.entries(providers).map(([key, value]) => (
                    <option key={key} value={key}>
                      {providerNames[key] || key}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ex: +221 77 123 45 67"
                  className="form-control"
                  required
                />
                <small>Format: +[indicatif pays] [numéro]</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Traitement...' : 'Payer maintenant'}
                </button>
              </div>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MobileMoneyPayment;

