import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        username: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setError('');
        setFieldErrors((prev) => ({
            ...prev,
            [name]: ''
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setFieldErrors({});

        const errors = {};

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            errors.email = 'Enter a valid email';
        }

        if (!formData.fullName.trim()) {
            errors.fullName = 'Full Name is required';
        }

        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        }

        if (formData.password.length < 8) {
            errors.password = 'Password must contain at least 8 characters';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                'http://localhost:5000/api/auth/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email.trim(),
                        username: formData.username.trim(),
                        password: formData.password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                const message = data.message || 'Registration failed';

                if (message.toLowerCase().includes('email')) {
                    setFieldErrors({ email: message });
                } else if (message.toLowerCase().includes('username')) {
                    setFieldErrors({ username: message });
                } else {
                    setError(message);
                }

                return;
            }

            navigate('/');
        } catch (err) {
            setError('Cannot connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <div className="register-container">
                <section className="register-card">
                    <img
                        className="register-logo"
                        src={logo}
                        alt="Ichgram"
                    />

                    <p className="register-description">
                        Sign up to see photos and videos
                        <br />
                        from your friends.
                    </p>

                    <form className="register-form" onSubmit={handleSubmit}>
                        <div className="register-field">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {fieldErrors.email && (
                                <span className="register-field-error">
                                    {fieldErrors.email}
                                </span>
                            )}
                        </div>

                        <div className="register-field">
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            {fieldErrors.fullName && (
                                <span className="register-field-error">
                                    {fieldErrors.fullName}
                                </span>
                            )}
                        </div>

                        <div className="register-field">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            {fieldErrors.username && (
                                <span className="register-field-error">
                                    {fieldErrors.username}
                                </span>
                            )}
                        </div>

                        <div className="register-field">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {fieldErrors.password && (
                                <span className="register-field-error">
                                    {fieldErrors.password}
                                </span>
                            )}
                        </div>

                        <p className="register-info">
                            People who use our service may have uploaded
                            your contact information to Ichgram.
                            <a href="#"> Learn More</a>
                        </p>

                        <p className="register-terms">
                            By signing up, you agree to our
                            <a href="#"> Terms</a>,
                            <a href="#"> Privacy Policy</a> and
                            <a href="#"> Cookies Policy</a>.
                        </p>

                        {error && (
                            <p className="register-error">
                                {error}
                            </p>
                        )}

                        <button
                            className="register-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing up...' : 'Sign up'}
                        </button>
                    </form>
                </section>

                <section className="register-login-card">
                    <span>Have an account?</span>
                    <a href="/">Log in</a>
                </section>
            </div>
        </main>
    );
};

export default Register;
