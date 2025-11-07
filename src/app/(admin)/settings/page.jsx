"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    app_name: "BirthCare System",
    app_description: "Comprehensive Birth Care Management System",
    timezone: "UTC",
    date_format: "Y-m-d",
    time_format: "H:i:s",
    maintenance_mode: false,
    registration_enabled: true,
    email_verification: true,
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    stripe_enabled: false,
    stripe_publishable_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    paypal_enabled: false,
    paypal_client_id: "",
    paypal_client_secret: "",
    paypal_mode: "sandbox", // sandbox or live
    gcash_enabled: false,
    gcash_merchant_id: "",
    gcash_api_key: "",
    paymaya_enabled: false,
    paymaya_public_key: "",
    paymaya_secret_key: "",
    default_currency: "PHP",
    subscription_trial_days: 7,
    subscription_grace_period_days: 3,
  });

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    mail_mailer: "smtp",
    mail_host: "smtp.gmail.com",
    mail_port: 587,
    mail_username: "",
    mail_password: "",
    mail_encryption: "tls",
    mail_from_address: "",
    mail_from_name: "BirthCare System",
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    session_lifetime: 120,
    password_min_length: 8,
    require_password_uppercase: true,
    require_password_lowercase: true,
    require_password_numbers: true,
    require_password_symbols: false,
    max_login_attempts: 5,
    lockout_duration: 15,
    two_factor_enabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would fetch from your API
      // const response = await axios.get('/api/admin/settings');
      // setGeneralSettings(response.data.general || generalSettings);
      // setPaymentSettings(response.data.payment || paymentSettings);
      // setEmailSettings(response.data.email || emailSettings);
      // setSecuritySettings(response.data.security || securitySettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({
        type: "error",
        text: "Failed to load settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsType, settings) => {
    try {
      setSaving(true);
      // In a real implementation, you would save to your API
      // await axios.post(`/api/admin/settings/${settingsType}`, settings);
      
      setMessage({
        type: "success",
        text: "Settings saved successfully!",
      });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", name: "General", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
    { id: "payments", name: "Payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "email", name: "Email", icon: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { id: "security", name: "Security", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Name
          </label>
          <input
            type="text"
            value={generalSettings.app_name}
            onChange={(e) => setGeneralSettings({...generalSettings, app_name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={generalSettings.timezone}
            onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Manila">Asia/Manila</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Application Description
        </label>
        <textarea
          value={generalSettings.app_description}
          onChange={(e) => setGeneralSettings({...generalSettings, app_description: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={generalSettings.date_format}
            onChange={(e) => setGeneralSettings({...generalSettings, date_format: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="Y-m-d">YYYY-MM-DD</option>
            <option value="m/d/Y">MM/DD/YYYY</option>
            <option value="d/m/Y">DD/MM/YYYY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Format
          </label>
          <select
            value={generalSettings.time_format}
            onChange={(e) => setGeneralSettings({...generalSettings, time_format: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="H:i:s">24 Hour (HH:MM:SS)</option>
            <option value="h:i:s A">12 Hour (HH:MM:SS AM/PM)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">System Preferences</h4>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="maintenance_mode"
            checked={generalSettings.maintenance_mode}
            onChange={(e) => setGeneralSettings({...generalSettings, maintenance_mode: e.target.checked})}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="maintenance_mode" className="ml-2 text-sm text-gray-700">
            Maintenance Mode
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="registration_enabled"
            checked={generalSettings.registration_enabled}
            onChange={(e) => setGeneralSettings({...generalSettings, registration_enabled: e.target.checked})}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="registration_enabled" className="ml-2 text-sm text-gray-700">
            Allow User Registration
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="email_verification"
            checked={generalSettings.email_verification}
            onChange={(e) => setGeneralSettings({...generalSettings, email_verification: e.target.checked})}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="email_verification" className="ml-2 text-sm text-gray-700">
            Require Email Verification
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings("general", generalSettings)}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white rounded-lg hover:from-[#A41F39] hover:to-[#923649] focus:ring-2 focus:ring-[#BF3853]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
        >
          {saving ? "Saving..." : "Save General Settings"}
        </button>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-8">
      {/* Stripe Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="stripe_enabled"
            checked={paymentSettings.stripe_enabled}
            onChange={(e) => setPaymentSettings({...paymentSettings, stripe_enabled: e.target.checked})}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="stripe_enabled" className="ml-2 text-lg font-medium text-gray-900">
            Stripe Payment Gateway
          </label>
        </div>

        {paymentSettings.stripe_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publishable Key
              </label>
              <input
                type="text"
                value={paymentSettings.stripe_publishable_key}
                onChange={(e) => setPaymentSettings({...paymentSettings, stripe_publishable_key: e.target.value})}
                placeholder="pk_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={paymentSettings.stripe_secret_key}
                onChange={(e) => setPaymentSettings({...paymentSettings, stripe_secret_key: e.target.value})}
                placeholder="sk_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Secret
              </label>
              <input
                type="password"
                value={paymentSettings.stripe_webhook_secret}
                onChange={(e) => setPaymentSettings({...paymentSettings, stripe_webhook_secret: e.target.value})}
                placeholder="whsec_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* PayPal Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="paypal_enabled"
            checked={paymentSettings.paypal_enabled}
            onChange={(e) => setPaymentSettings({...paymentSettings, paypal_enabled: e.target.checked})}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="paypal_enabled" className="ml-2 text-lg font-medium text-gray-900">
            PayPal Payment Gateway
          </label>
        </div>

        {paymentSettings.paypal_enabled && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={paymentSettings.paypal_client_id}
                  onChange={(e) => setPaymentSettings({...paymentSettings, paypal_client_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={paymentSettings.paypal_client_secret}
                  onChange={(e) => setPaymentSettings({...paymentSettings, paypal_client_secret: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <select
                value={paymentSettings.paypal_mode}
                onChange={(e) => setPaymentSettings({...paymentSettings, paypal_mode: e.target.value})}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Philippine Payment Methods */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Philippine Payment Methods</h3>
        
        {/* GCash */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="gcash_enabled"
              checked={paymentSettings.gcash_enabled}
              onChange={(e) => setPaymentSettings({...paymentSettings, gcash_enabled: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="gcash_enabled" className="ml-2 font-medium text-gray-900">
              GCash
            </label>
          </div>

          {paymentSettings.gcash_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID
                </label>
                <input
                  type="text"
                  value={paymentSettings.gcash_merchant_id}
                  onChange={(e) => setPaymentSettings({...paymentSettings, gcash_merchant_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={paymentSettings.gcash_api_key}
                  onChange={(e) => setPaymentSettings({...paymentSettings, gcash_api_key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* PayMaya */}
        <div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="paymaya_enabled"
              checked={paymentSettings.paymaya_enabled}
              onChange={(e) => setPaymentSettings({...paymentSettings, paymaya_enabled: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="paymaya_enabled" className="ml-2 font-medium text-gray-900">
              PayMaya
            </label>
          </div>

          {paymentSettings.paymaya_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key
                </label>
                <input
                  type="text"
                  value={paymentSettings.paymaya_public_key}
                  onChange={(e) => setPaymentSettings({...paymentSettings, paymaya_public_key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={paymentSettings.paymaya_secret_key}
                  onChange={(e) => setPaymentSettings({...paymentSettings, paymaya_secret_key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Currency
            </label>
            <select
              value={paymentSettings.default_currency}
              onChange={(e) => setPaymentSettings({...paymentSettings, default_currency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="PHP">PHP - Philippine Peso</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trial Period (Days)
            </label>
            <input
              type="number"
              value={paymentSettings.subscription_trial_days}
              onChange={(e) => setPaymentSettings({...paymentSettings, subscription_trial_days: parseInt(e.target.value)})}
              min="0"
              max="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grace Period (Days)
            </label>
            <input
              type="number"
              value={paymentSettings.subscription_grace_period_days}
              onChange={(e) => setPaymentSettings({...paymentSettings, subscription_grace_period_days: parseInt(e.target.value)})}
              min="0"
              max="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings("payments", paymentSettings)}
          disabled={saving}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Payment Settings"}
        </button>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mail Driver
          </label>
          <select
            value={emailSettings.mail_mailer}
            onChange={(e) => setEmailSettings({...emailSettings, mail_mailer: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="smtp">SMTP</option>
            <option value="sendmail">Sendmail</option>
            <option value="mailgun">Mailgun</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Host
          </label>
          <input
            type="text"
            value={emailSettings.mail_host}
            onChange={(e) => setEmailSettings({...emailSettings, mail_host: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Port
          </label>
          <input
            type="number"
            value={emailSettings.mail_port}
            onChange={(e) => setEmailSettings({...emailSettings, mail_port: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Encryption
          </label>
          <select
            value={emailSettings.mail_encryption}
            onChange={(e) => setEmailSettings({...emailSettings, mail_encryption: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
            <option value="">None</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="email"
            value={emailSettings.mail_username}
            onChange={(e) => setEmailSettings({...emailSettings, mail_username: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={emailSettings.mail_password}
            onChange={(e) => setEmailSettings({...emailSettings, mail_password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Email Address
          </label>
          <input
            type="email"
            value={emailSettings.mail_from_address}
            onChange={(e) => setEmailSettings({...emailSettings, mail_from_address: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            value={emailSettings.mail_from_name}
            onChange={(e) => setEmailSettings({...emailSettings, mail_from_name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings("email", emailSettings)}
          disabled={saving}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Email Settings"}
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Lifetime (minutes)
          </label>
          <input
            type="number"
            value={securitySettings.session_lifetime}
            onChange={(e) => setSecuritySettings({...securitySettings, session_lifetime: parseInt(e.target.value)})}
            min="5"
            max="1440"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Password Length
          </label>
          <input
            type="number"
            value={securitySettings.password_min_length}
            onChange={(e) => setSecuritySettings({...securitySettings, password_min_length: parseInt(e.target.value)})}
            min="4"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Password Requirements</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="require_uppercase"
              checked={securitySettings.require_password_uppercase}
              onChange={(e) => setSecuritySettings({...securitySettings, require_password_uppercase: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="require_uppercase" className="ml-2 text-sm text-gray-700">
              Require uppercase letters
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="require_lowercase"
              checked={securitySettings.require_password_lowercase}
              onChange={(e) => setSecuritySettings({...securitySettings, require_password_lowercase: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="require_lowercase" className="ml-2 text-sm text-gray-700">
              Require lowercase letters
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="require_numbers"
              checked={securitySettings.require_password_numbers}
              onChange={(e) => setSecuritySettings({...securitySettings, require_password_numbers: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="require_numbers" className="ml-2 text-sm text-gray-700">
              Require numbers
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="require_symbols"
              checked={securitySettings.require_password_symbols}
              onChange={(e) => setSecuritySettings({...securitySettings, require_password_symbols: e.target.checked})}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="require_symbols" className="ml-2 text-sm text-gray-700">
              Require special characters
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Login Attempts
          </label>
          <input
            type="number"
            value={securitySettings.max_login_attempts}
            onChange={(e) => setSecuritySettings({...securitySettings, max_login_attempts: parseInt(e.target.value)})}
            min="3"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lockout Duration (minutes)
          </label>
          <input
            type="number"
            value={securitySettings.lockout_duration}
            onChange={(e) => setSecuritySettings({...securitySettings, lockout_duration: parseInt(e.target.value)})}
            min="5"
            max="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="two_factor_enabled"
          checked={securitySettings.two_factor_enabled}
          onChange={(e) => setSecuritySettings({...securitySettings, two_factor_enabled: e.target.checked})}
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        />
        <label htmlFor="two_factor_enabled" className="ml-2 text-sm text-gray-700">
          Enable Two-Factor Authentication
        </label>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => saveSettings("security", securitySettings)}
          disabled={saving}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Security Settings"}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
            <p className="mt-4 text-gray-700 font-semibold">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SYSTEM SETTINGS
          </h1>
          <p className="text-gray-600 text-lg">
            Configure system-wide settings and preferences
          </p>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className={`mb-6 p-6 rounded-xl border-0 shadow-lg ${
            message.type === "success" 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border border-red-200"
          }`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${
                message.type === "success" ? "bg-green-100" : "bg-red-100"
              }`}>
                <svg className={`h-5 w-5 ${message.type === "success" ? "text-green-600" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={message.type === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                </svg>
              </div>
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        {/* Settings Container */}
        <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
          {/* Tabs */}
          <div className="bg-gradient-to-r from-[#BF3853] to-[#A41F39]">
            <nav className="flex space-x-0 px-0">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-4 font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white text-[#BF3853] shadow-lg"
                      : "text-white hover:bg-white/20"
                  } ${index === 0 ? "rounded-tl-xl" : ""} ${index === tabs.length - 1 ? "rounded-tr-xl" : ""}`}
                >
                  <div className={`p-2 rounded-lg ${
                    activeTab === tab.id ? "bg-gradient-to-br from-[#FDB3C2] to-[#F891A5]" : "bg-white/20"
                  }`}>
                    <svg
                      className={`h-4 w-4 ${activeTab === tab.id ? "text-white" : "text-white"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={tab.icon}
                      />
                    </svg>
                  </div>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "general" && renderGeneralSettings()}
            {activeTab === "payments" && renderPaymentSettings()}
            {activeTab === "email" && renderEmailSettings()}
            {activeTab === "security" && renderSecuritySettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;