import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/home');
    };

    return (
        <div className="landing-page">
            <header className="landing-header">
                <nav className="landing-nav">
                    <div className="logo">WebRTC Connect</div>
                    <button onClick={handleGetStarted} className="nav-signin-btn">Get Started</button>
                </nav>
            </header>

            <main>
                <section className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">Seamless Video Conferencing, Right in Your Browser</h1>
                        <p className="hero-subtitle">Secure, reliable, and easy-to-use video calls without any downloads. Get started in seconds.</p>
                        <button onClick={handleGetStarted} className="hero-cta-btn">
                            Start a Call for Free
                        </button>
                    </div>
                    <div className="hero-animation">
                        <div className="user-bubble user1"></div>
                        <div className="connection-line"></div>
                        <div className="user-bubble user2"></div>
                    </div>
                </section>

                <section className="features-section">
                    <h2 className="section-title">Everything You Need for Great Connections</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <h3>HD Quality Video</h3>
                            <p>Experience crystal-clear video and audio, powered by WebRTC technology.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Browser-Based</h3>
                            <p>No installations or downloads required. Join calls instantly from your web browser.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Secure & Private</h3>
                            <p>End-to-end encryption ensures your conversations remain private and secure.</p>
                        </div>
                    </div>
                </section>

                <section className="how-it-works-section">
                    <h2 className="section-title">Get Started in 3 Easy Steps</h2>
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Create a Room</h3>
                            <p>Enter your email and a room name to start a new session.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Share the Link</h3>
                            <p>Invite others by simply sharing the room link.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Start Talking</h3>
                            <p>Connect instantly and start your video conversation.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; 2025 WebRTC Connect. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
