import React, { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Login from './Login'

const LoginContainer = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password);

            if (error) {
                setError(error.message);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Login
            email={email}
            password={password}
            showPassword={showPassword}
            loading={loading}
            error={error}
            isSignUp={isSignUp}
            setEmail={setEmail}
            setPassword={setPassword}
            setShowPassword={setShowPassword}
            setIsSignUp={setIsSignUp}
            handleSubmit={handleSubmit}
        />
    )
}

export default LoginContainer