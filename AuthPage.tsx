
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Input from './Input';
import Button from './Button';
import { useLanguage } from '../hooks/useLanguage';

const AuthPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      // Error is already set in useAuth, no need to set again here
      console.error(t('Login Failed'), err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">{t('Poultry Farm Login')}</h2>
        <form onSubmit={handleSubmit}>
          <Input
            id="username"
            label={t('Username')}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="farmowner"
            disabled={isLoading}
          />
          <Input
            id="password"
            label={t('Password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password"
            disabled={isLoading}
          />
          {error && <p className="text-red-500 text-sm mb-4 text-center">{t(error as any) || error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('Logging In...') : t('Login')}
          </Button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          {t('Use username: ')}<span className="font-bold">farmowner</span> {t('and password: ')}<span className="font-bold">password</span> {t('for demo.')}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
