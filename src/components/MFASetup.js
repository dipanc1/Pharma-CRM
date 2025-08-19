import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, QrCodeIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

function MFASetup() {
  const { enrollMFA, listFactors, unenrollMFA } = useAuth();
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  useEffect(() => {
    loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFactors = async () => {
    try {
      const { data, error } = await listFactors();
      if (error) throw error;
      setFactors(data?.all || []);
    } catch (error) {
      console.error('Error loading MFA factors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollTOTP = async () => {
    try {
      setEnrolling(true);
      const { data, error } = await enrollMFA('totp');
      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
    } catch (error) {
      console.error('Error enrolling TOTP:', error);
      alert('Error setting up TOTP. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (factorId) => {
    if (!window.confirm('Are you sure you want to remove this MFA method?')) return;

    try {
      const { error } = await unenrollMFA(factorId);
      if (error) throw error;
      await loadFactors();
    } catch (error) {
      console.error('Error unenrolling MFA:', error);
      alert('Error removing MFA method. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-medium text-gray-900">Multi-Factor Authentication</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Enhance your account security by enabling multi-factor authentication.
          This adds an extra layer of protection to your account.
        </p>

        {/* Current MFA Methods */}
        {factors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Active MFA Methods</h3>
            <div className="space-y-2">
              {factors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {factor.factor_type === 'totp' && <QrCodeIcon className="h-5 w-5 text-gray-500" />}
                    {factor.factor_type === 'phone' && <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {factor.factor_type === 'totp' ? 'Authenticator App' : 'Phone Number'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {factor.friendly_name || factor.factor_type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnenroll(factor.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New MFA Methods */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add MFA Method</h3>

          {/* TOTP Setup */}
          {!factors.find(f => f.factor_type === 'totp') && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <QrCodeIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Authenticator App</h4>
                  <p className="text-xs text-gray-500">Use apps like Google Authenticator or Authy</p>
                </div>
              </div>

              {!qrCode ? (
                <button
                  onClick={handleEnrollTOTP}
                  disabled={enrolling}
                  className="btn-primary text-sm"
                >
                  {enrolling ? 'Setting up...' : 'Setup TOTP'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                    <p className="text-xs text-gray-500 mt-2">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Manual Entry Code
                    </label>
                    <input
                      type="text"
                      value={totpSecret}
                      readOnly
                      className="input-field text-xs"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    After scanning, you'll need to enter the 6-digit code from your app to complete setup.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Phone Setup */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">SMS Verification</h4>
                <p className="text-xs text-gray-500">Receive codes via text message</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              SMS verification can be enabled in your Supabase dashboard under Authentication settings.
            </p>
            <button
              disabled
              className="btn-secondary text-sm opacity-50 cursor-not-allowed"
            >
              Setup SMS (Admin Only)
            </button>
          </div>

          {/* Email Setup */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-500" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Verification</h4>
                <p className="text-xs text-gray-500">Receive codes via email</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Email verification can be enabled in your Supabase dashboard under Authentication settings.
            </p>
            <button
              disabled
              className="btn-secondary text-sm opacity-50 cursor-not-allowed"
            >
              Setup Email (Admin Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MFASetup;
