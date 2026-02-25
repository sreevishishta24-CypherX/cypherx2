import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

type Screen = 'welcome' | 'input' | 'loading' | 'results' | 'history' | 'smartwatch' | 'hospitalFinder' | 'healthAssistant' | 'theme' | 'financialAidQuery' | 'financialAidResults' | 'institutionalContribution';

type Check = {
    id: number;
    symptoms: string;
    results: string;
    date: string;
};

type Hospital = {
    name: string;
    uri: string;
    bestDoctor?: string;
    rating?: string;
    contact?: string;
};

type Position = {
    lat: number;
    lon: number;
};

type ChatMessage = {
    role: 'user' | 'model';
    text: string;
};

type FinancialAidOption = {
    schemeName: string;
    description: string;
    howToAccess: string;
    websiteLink: string;
};

const themes = {
    default: {
        '--primary-color': '#007BFF',
        '--primary-hover-color': '#0056b3',
        '--gradient-start': '#e0c3fc',
        '--gradient-end': '#8ec5fc',
    },
    forest: {
        '--primary-color': '#28a745',
        '--primary-hover-color': '#218838',
        '--gradient-start': '#d4e7b0',
        '--gradient-end': '#a3d8a3',
    },
    sunset: {
        '--primary-color': '#ff6347',
        '--primary-hover-color': '#e55337',
        '--gradient-start': '#ffecd2',
        '--gradient-end': '#fcb69f',
    },
};

// Haversine formula to calculate distance between two lat/lon points in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const IntroPage = ({ onGetStarted }: { onGetStarted: () => void }) => (
    <div className="container intro-container">
        <div className="intro-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 .81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
        </div>
        <h1>MedAssistPro</h1>
        <p>Your AI-powered health companion for early insights and guidance.</p>
        <button className="btn btn-primary" onClick={onGetStarted}>Get Started</button>
    </div>
);


const LoginPage = ({ onLogin, error, onForgotPassword }: { onLogin: (user: string, pass: string) => void, error: string, onForgotPassword: () => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="container login-container">
            <h1>Login</h1>
            <p>Please enter your credentials to continue.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group-extra">
                    <a href="#" onClick={(e) => { e.preventDefault(); onForgotPassword(); }} className="forgot-password-link">
                        Forgot Password?
                    </a>
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn btn-primary">Login</button>
            </form>
        </div>
    );
};

const ForgotPasswordPage = ({ onBackToLogin }: { onBackToLogin: () => void }) => {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('If an account with that username exists, a password reset link has been sent to the registered email address.');
        setUsername(''); 
    };

    if (message) {
        return (
            <div className="container login-container">
                <h1>Password Reset</h1>
                <p className="confirmation-message">{message}</p>
                <button onClick={onBackToLogin} className="btn btn-secondary">Back to Login</button>
            </div>
        );
    }

    return (
        <div className="container login-container">
            <h1>Forgot Password</h1>
            <p>Enter your username below to receive a password reset link.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="reset-username">Username</label>
                    <input
                        type="text"
                        id="reset-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Send Reset Link</button>
            </form>
            <button onClick={onBackToLogin} className="btn btn-secondary" style={{ marginTop: '15px' }}>Back to Login</button>
        </div>
    );
};

const WelcomeScreen = ({ onNavigate, hasHistory, onLogout }: { onNavigate: (screen: Screen) => void, hasHistory: boolean, onLogout: () => void }) => (
    <div className="container welcome-container">
        <div className="welcome-header">
            <h1>MedAssistPro</h1>
            <p>Your friendly health companion. Get started by checking your symptoms.</p>
        </div>

        <button className="btn btn-primary btn-full-width" onClick={() => onNavigate('input')}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
            Start Symptom Check
        </button>

        <div className="action-grid">
            <div className="action-card" role="button" tabIndex={0} onClick={() => onNavigate('healthAssistant')}>
                <div className="action-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                </div>
                <h3>Ask Health Assistant</h3>
                <p>Get answers to general health questions.</p>
            </div>
            <div className="action-card" role="button" tabIndex={0} onClick={() => onNavigate('smartwatch')}>
                <div className="action-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42z" fill="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.22-12.05c-.06-.05-.12-.1-.19-.14l-1.6-1.04c-.31-.2-.72-.1-.92.21L7.5 9.85c-.2.31-.1.72.21.92l1.6 1.04c.07.05.13.09.19.14l4.5 2.92c.31.2.72.1.92-.21l1.58-2.43c.2-.31.1-.72-.21-.92l-4.5-2.92zM19 12h-2V9h-2v3h-2v2h2v3h2v-3h2v-2z" fill="currentColor"/></svg>
                </div>
                <h3>Link Smartwatch</h3>
                <p>Monitor vitals & location in real-time.</p>
            </div>
             <div className="action-card" role="button" tabIndex={0} onClick={() => onNavigate('financialAidQuery')}>
                <div className="action-card-icon action-card-icon-bank">
                   <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 10h3v7H4zM10.5 10h3v7h-3zM2 19h20v3H2zM17 10h3v7h-3zM12 1L2 6v2h20V6z"/></svg>
                </div>
                <h3>Find Financial Aid</h3>
                <p>Explore government & insurance options.</p>
            </div>
            {hasHistory && (
                <div className="action-card" role="button" tabIndex={0} onClick={() => onNavigate('history')}>
                    <div className="action-card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-.22-13.88l-1.42 1.42L12 11.23l2.64 2.64 1.42-1.42L12 8.38l-1.78 1.74zM12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    </div>
                    <h3>View Past Checks</h3>
                    <p>Review your saved symptom history.</p>
                </div>
            )}
             <div className="action-card" role="button" tabIndex={0} onClick={() => onNavigate('institutionalContribution')}>
                <div className="action-card-icon action-card-icon-institution">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                </div>
                <h3>For Institutions</h3>
                <p>Learn how to contribute to our projects.</p>
            </div>
            <div className="action-card" role="button" tabIndex={0} onClick={() => onNavigate('theme')}>
                 <div className="action-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                </div>
                <h3>Customize Theme</h3>
                <p>Personalize the app's color scheme.</p>
            </div>
             <div className="action-card" role="button" tabIndex={0} onClick={onLogout}>
                 <div className="action-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                </div>
                <h3>Logout</h3>
                <p>Securely sign out of your account.</p>
            </div>
        </div>

        <p className="disclaimer">This tool is for informational purposes only and is not a substitute for professional medical advice.</p>
    </div>
);

const InputScreen = ({ symptoms, onSymptomsChange, error, isSpeechApiSupported, isListening, onToggleListening, onAnalyze, onBack }: {
    symptoms: string;
    onSymptomsChange: (value: string) => void;
    error: string;
    isSpeechApiSupported: boolean;
    isListening: boolean;
    onToggleListening: () => void;
    onAnalyze: () => void;
    onBack: () => void;
}) => (
    <div className="container">
        <h1>Describe Your Symptoms</h1>
        <p>Please list any symptoms you are experiencing. You can type them in or use the microphone button to speak.</p>
        <textarea value={symptoms} onChange={(e) => onSymptomsChange(e.target.value)} placeholder="Enter your symptoms here..." aria-label="Symptom input area" readOnly={isListening}></textarea>
        {error && <p className="error-message">{error}</p>}
        <div className="btn-group">
            {isSpeechApiSupported && (
                <button className={`btn btn-voice btn-inline ${isListening ? 'listening' : ''}`} onClick={onToggleListening} disabled={isListening} aria-label="Add symptoms with voice">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" /></svg>
                    {isListening ? 'Listening...' : 'Add with Voice'}
                </button>
            )}
            <button className="btn btn-primary btn-inline" onClick={onAnalyze} disabled={isListening}>Analyze Symptoms</button>
        </div>
        <button className="btn btn-secondary" style={{ marginTop: '15px' }} onClick={onBack} disabled={isListening}>Back</button>
    </div>
);

const LoadingScreen = () => (
    <div className="container">
        <h1>Analyzing...</h1>
        <p>Please wait a moment while we analyze your symptoms.</p>
        <div className="loader"></div>
    </div>
);

const ResultsScreen = ({ results, hasContributed, onContribute, onNavigate, hasHistory, onStartNewCheck }: { results: string, hasContributed: boolean, onContribute: () => void, onNavigate: (screen: Screen) => void, hasHistory: boolean, onStartNewCheck: () => void }) => (
    <div className="container">
        <h1>Analysis Results</h1>
        <div className="results" dangerouslySetInnerHTML={{ __html: `<h2>Potential Conditions</h2>${results.replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>').replace(/\n/g, '<br />')}` }}></div>
        <p className="disclaimer" style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>Remember to consult a healthcare professional for an accurate diagnosis.</p>
        
        <div className="contribution-container">
            {hasContributed ? (
                <>
                    <h3>Thank You!</h3>
                    <p>Your contribution helps advance open health research and improve this tool for everyone.</p>
                </>
            ) : (
                <>
                    <h3>Help Improve Healthcare for Everyone</h3>
                    <p>By contributing your anonymized symptom data, you help foster a shared responsibility model for building better, open healthcare technologies.</p>
                    <button className="btn btn-secondary" onClick={onContribute}>Contribute Anonymously</button>
                </>
            )}
        </div>

        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('hospitalFinder')}>Find Nearby Hospitals</button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', width: '100%' }}>
                 <button className="btn btn-secondary btn-inline" onClick={onStartNewCheck}>Start a New Check</button>
                 {hasHistory && <button className="btn btn-secondary btn-inline" onClick={() => onNavigate('history')}>View Past Checks</button>}
            </div>
        </div>
    </div>
);

const HistoryScreen = ({ history, selectedHistoryId, onSelectHistoryId, onBackToHome }: {
    history: Check[];
    selectedHistoryId: number | null;
    onSelectHistoryId: (id: number | null) => void;
    onBackToHome: () => void;
}) => (
    <div className="container">
        <h1>Past Symptom Checks</h1>
        {history.length === 0 ? <p>You have no saved checks yet.</p> : (
            <div className="history-list">
                {history.map((check) => (
                    <div key={check.id} className="history-item">
                        <button className="history-item-header" onClick={() => onSelectHistoryId(selectedHistoryId === check.id ? null : check.id)} aria-expanded={selectedHistoryId === check.id}>
                            <span>Check from {check.date}</span>
                            <span aria-hidden="true">{selectedHistoryId === check.id ? '▲' : '▼'}</span>
                        </button>
                        {selectedHistoryId === check.id && (
                            <div className="history-item-body">
                                <h3>Symptoms Described:</h3>
                                <p>{check.symptoms}</p>
                                <h3>Analysis Result:</h3>
                                <div className="results" style={{ marginTop: '0' }} dangerouslySetInnerHTML={{ __html: check.results.replace(/\n/g, '<br />') }}></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
        <button className="btn btn-secondary" style={{ marginTop: '30px' }} onClick={onBackToHome}>Back to Home</button>
    </div>
);

const SmartwatchScreen = ({ isLinked, onLink, heartRate, oxygenLevel, emergencyContact, onEmergencyContactChange, currentPosition, isOutOfBounds, onSimulateAbnormal, onBackToHome }: {
    isLinked: boolean;
    onLink: () => void;
    heartRate: number;
    oxygenLevel: number;
    emergencyContact: string;
    onEmergencyContactChange: (value: string) => void;
    currentPosition: Position | null;
    isOutOfBounds: boolean;
    onSimulateAbnormal: () => void;
    onBackToHome: () => void;
}) => {
    if (!isLinked) {
        return (
            <div className="container">
                <h1>Link Your Smartwatch</h1>
                <p>Connect your smartwatch to monitor your vitals and location in real-time.</p>
                <button className="btn btn-primary" onClick={onLink}>Link Smartwatch</button>
                <button className="btn btn-secondary" style={{ marginTop: '15px' }} onClick={onBackToHome}>Back to Home</button>
            </div>
        );
    }
    const isHrAbnormal = heartRate < 60 || heartRate > 100;
    const isO2Abnormal = oxygenLevel < 95;
    return (
        <div className="container">
            <h1>Vitals & Location Monitor</h1>
            <p>Your smartwatch is now linked and monitoring your vitals and location.</p>
            <div className="vitals-display">
                <div className="vital-card"><h3>Heart Rate</h3><div className={`vital-value ${isHrAbnormal ? 'abnormal' : ''}`}>{heartRate} <span className="unit">bpm</span></div></div>
                <div className="vital-card"><h3>Oxygen Level</h3><div className={`vital-value ${isO2Abnormal ? 'abnormal' : ''}`}>{oxygenLevel} <span className="unit">%</span></div></div>
            </div>

            <div className="location-display">
                <h3>Live Location</h3>
                {currentPosition ? (
                    <div className="location-info">
                        <span>Lat: {currentPosition.lat.toFixed(5)}, Lon: {currentPosition.lon.toFixed(5)}</span>
                        <a href={`https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lon}`} target="_blank" rel="noopener noreferrer">View on Map</a>
                    </div>
                ) : (
                    <p style={{fontSize: '1rem', marginBottom: 0}}>Acquiring GPS signal...</p>
                )}
                {isOutOfBounds && (
                    <div className="location-alert">
                        ALERT: User is more than 5km from home!
                    </div>
                )}
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
                <label htmlFor="emergency-contact">Emergency Contact Number</label>
                <input type="tel" id="emergency-contact" value={emergencyContact} onChange={(e) => onEmergencyContactChange(e.target.value)} placeholder="Enter phone number" />
            </div>
             <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button className="btn btn-primary" onClick={onSimulateAbnormal} disabled={!emergencyContact.trim()}>Simulate Abnormal Reading</button>
                <button className="btn btn-secondary" onClick={onBackToHome}>Back to Home</button>
            </div>
        </div>
    );
};

const HospitalFinderScreen = ({ budget, onBudgetChange, isFindingHospitals, hospitals, hospitalError, onFindHospitals, onStartOver }: {
    budget: string;
    onBudgetChange: (value: string) => void;
    isFindingHospitals: boolean;
    hospitals: Hospital[];
    hospitalError: string;
    onFindHospitals: (skipBudget: boolean) => void;
    onStartOver: () => void;
}) => (
    <div className="container">
        <h1>Find a Hospital</h1>

        {/* Form View (only when no results and not loading) */}
        {!isFindingHospitals && hospitals.length === 0 && (
             <>
                <p>Enter your estimated treatment budget to find specialized hospitals and doctors near you. Or, skip this step to see all options.</p>
                <div className="form-group">
                    <label htmlFor="budget">Estimated Budget ($)</label>
                    <input 
                        type="number" 
                        id="budget"
                        value={budget}
                        onChange={(e) => onBudgetChange(e.target.value)}
                        placeholder="e.g., 5000"
                    />
                </div>
                {hospitalError && <p className="error-message">{hospitalError}</p>}
                <div className="btn-group" style={{ marginTop: '20px' }}>
                    <button className="btn btn-primary" onClick={() => onFindHospitals(false)}>Find Hospitals</button>
                    <button className="btn btn-secondary" onClick={() => onFindHospitals(true)}>Skip for now</button>
                </div>
            </>
        )}

        {/* Loading View */}
        {isFindingHospitals && (
            <>
                <p>Searching for hospitals and specialists near you...</p>
                <div className="loader"></div>
            </>
        )}
        
        {/* Results View */}
        {!isFindingHospitals && hospitals.length > 0 && (
            <>
                <h2>Recommended Hospitals & Specialists</h2>
                <p>Here are some hospitals and specialists that may be able to help, based on your symptoms and budget.</p>
                <ul className="hospital-list">
                    {hospitals.map(hospital => (
                       <li key={hospital.uri} className="hospital-info-item">
                           <div className="hospital-details">
                               <span className="hospital-name">{hospital.name}</span>
                               <span className="contact-info">Contact: {hospital.contact}</span>
                               <span className="doctor-info">Best Doctor: {hospital.bestDoctor}</span>
                               <span className="rating-info">Rating: {hospital.rating}</span>
                           </div>
                           <div className="hospital-actions">
                               <a href={hospital.uri} target="_blank" rel="noopener noreferrer" className="btn-map">View on Map</a>
                           </div>
                       </li>
                   ))}
                </ul>
            </>
        )}
        
        {/* Error view (when an error exists and there are no results) */}
        {!isFindingHospitals && hospitalError && hospitals.length === 0 && (
             <p className="error-message">{hospitalError}</p>
        )}

        <button className="btn btn-secondary" style={{ marginTop: '30px' }} onClick={onStartOver}>Start Over</button>
    </div>
);

const FinancialAidQueryScreen = ({ query, onQueryChange, onFindAid, onBack }: {
    query: string;
    onQueryChange: (value: string) => void;
    onFindAid: () => void;
    onBack: () => void;
}) => (
    <div className="container">
        <h1>Find Financial Aid</h1>
        <p>Describe your situation or the type of financial help you need for medical expenses.</p>
        <textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="e.g., 'Help with costs for heart surgery' or 'Support for ongoing diabetes treatment'"
            aria-label="Financial aid query input"
        ></textarea>
        <button className="btn btn-primary" onClick={onFindAid} disabled={!query.trim()}>Find Aid Options</button>
        <button className="btn btn-secondary" style={{ marginTop: '15px' }} onClick={onBack}>Back to Home</button>
    </div>
);


const FinancialAidResultsScreen = ({ isLoading, aidOptions, error, onBack }: { isLoading: boolean, aidOptions: FinancialAidOption[], error: string, onBack: () => void }) => (
    <div className="container">
        <h1>Financial Aid Options</h1>
        {isLoading ? (
            <>
                <p>Researching financial aid options for you...</p>
                <div className="loader"></div>
            </>
        ) : (
            <>
                <p>Based on your situation, here are some potential schemes that may help with treatment costs.</p>
                 {error && <p className="error-message">{error}</p>}
                <div className="financial-aid-list">
                    {aidOptions.map((option, index) => (
                        <div key={index} className="financial-aid-card">
                            <h3>{option.schemeName}</h3>
                            <p className="aid-description">{option.description}</p>
                            <p className="aid-howto"><strong>How to Access:</strong> {option.howToAccess}</p>
                            <a href={option.websiteLink} target="_blank" rel="noopener noreferrer" className="btn btn-link">
                                Visit Website
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                            </a>
                        </div>
                    ))}
                </div>
                <p className="disclaimer">This information is for guidance only. Please verify your eligibility and details with the respective authorities or companies.</p>
            </>
        )}
        <button className="btn btn-secondary" style={{ marginTop: '30px' }} onClick={onBack}>Back to Home</button>
    </div>
);

const HealthAssistantScreen = ({ messages, isTyping, onSendMessage, onBack }: {
    messages: ChatMessage[];
    isTyping: boolean;
    onSendMessage: (message: string) => void;
    onBack: () => void;
}) => {
    const [input, setInput] = useState('');
    const messageListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="container">
            <h1>Health Assistant</h1>
            <p>Ask me any general health questions!</p>
            <div className="chat-container">
                <div className="message-list" ref={messageListRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            {msg.text}
                        </div>
                    ))}
                    {isTyping && <div className="typing-indicator">Assistant is typing...</div>}
                </div>
                <form className="chat-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        aria-label="Chat input"
                        disabled={isTyping}
                    />
                    <button type="submit" className="btn btn-primary" disabled={isTyping || !input.trim()}>Send</button>
                </form>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '30px' }} onClick={onBack}>Back to Home</button>
        </div>
    );
};

const ThemeScreen = ({ currentTheme, onSelectTheme, onBack }: { currentTheme: string, onSelectTheme: (theme: string) => void, onBack: () => void }) => (
    <div className="container">
        <h1>Customize Theme</h1>
        <p>Choose a color palette that you like.</p>
        <div className="theme-selector">
            {Object.entries(themes).map(([name, colors]) => (
                <div
                    key={name}
                    className={`theme-option ${currentTheme === name ? 'active' : ''}`}
                    onClick={() => onSelectTheme(name)}
                    role="button"
                    aria-pressed={currentTheme === name}
                    tabIndex={0}
                >
                    <div className="theme-preview" style={{ background: `linear-gradient(120deg, ${colors['--gradient-start']} 0%, ${colors['--gradient-end']} 100%)` }}>
                        <span style={{ backgroundColor: colors['--primary-color'] }}>Aa</span>
                    </div>
                    <p className="theme-name">{name.charAt(0).toUpperCase() + name.slice(1)}</p>
                </div>
            ))}
        </div>
        <button className="btn btn-secondary" style={{ marginTop: '30px' }} onClick={onBack}>Back to Home</button>
    </div>
);

const InstitutionalContributionScreen = ({ onBack }: { onBack: () => void }) => (
    <div className="container">
        <h1>For Healthcare Institutions</h1>
        <p>We believe in fostering a shared responsibility model to advance open-source health technologies. Institutions that use these tools are encouraged to contribute back to the projects.</p>
        
        <h2>How You Can Contribute</h2>
        <div className="contribution-options-grid">
            <div className="contribution-option-card">
                <h3>Code</h3>
                <p>Contribute directly to our open-source projects by improving features, fixing bugs, and enhancing functionality.</p>
            </div>
            <div className="contribution-option-card">
                <h3>Documentation</h3>
                <p>Help us improve guides, tutorials, and API references to make our tools more accessible for everyone.</p>
            </div>
            <div className="contribution-option-card">
                <h3>Funding</h3>
                <p>Provide financial support to ensure consistent updates, professional maintenance, and long-term sustainability of key projects.</p>
            </div>
        </div>

        <button className="btn btn-primary" style={{ marginTop: '30px' }} onClick={() => alert('Thank you for your interest! Please contact us at contribute@example.com')}>Get Involved</button>
        <button className="btn btn-secondary" style={{ marginTop: '15px' }} onClick={onBack}>Back to Home</button>
    </div>
);

const App = ({ onLogout }: { onLogout: () => void }) => {
    const [screen, setScreen] = useState<Screen>('welcome');
    const [symptoms, setSymptoms] = useState('');
    const [results, setResults] = useState('');
    const [error, setError] = useState('');
    const [history, setHistory] = useState<Check[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechApiSupported, setIsSpeechApiSupported] = useState(false);
    const [isLinked, setIsLinked] = useState(false);
    const [heartRate, setHeartRate] = useState(0);
    const [oxygenLevel, setOxygenLevel] = useState(0);
    const [emergencyContact, setEmergencyContact] = useState('');
    const [budget, setBudget] = useState('');
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [isFindingHospitals, setIsFindingHospitals] = useState(false);
    const [hospitalError, setHospitalError] = useState('');
    const [homePosition, setHomePosition] = useState<Position | null>(null);
    const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
    const [isOutOfBounds, setIsOutOfBounds] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isAssistantTyping, setIsAssistantTyping] = useState(false);
    const [theme, setTheme] = useState('default');
    const [hasContributed, setHasContributed] = useState(false);
    const [financialAidQuery, setFinancialAidQuery] = useState('');
    const [financialAidInfo, setFinancialAidInfo] = useState<FinancialAidOption[]>([]);
    const [financialAidError, setFinancialAidError] = useState('');
    const [isFindingFinancialAid, setIsFindingFinancialAid] = useState(false);

    const vitalsAlertShownRef = useRef(false);
    const outOfBoundsAlertShownRef = useRef(false);
    const locationWatchIdRef = useRef<number | null>(null);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const applyTheme = (themeName: string) => {
        const themeColors = themes[themeName as keyof typeof themes];
        if (!themeColors) {
            console.warn(`Theme "${themeName}" not found. Using default.`);
            return;
        }
        for (const [key, value] of Object.entries(themeColors)) {
            document.documentElement.style.setProperty(key, value);
        }
        setTheme(themeName);
    };

    const handleSelectTheme = (themeName: string) => {
        localStorage.setItem('appTheme', themeName);
        applyTheme(themeName);
    };

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('symptomHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Could not load history from localStorage", e);
        }
        
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme && themes[savedTheme as keyof typeof themes]) {
            applyTheme(savedTheme);
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setIsSpeechApiSupported(!!SpeechRecognition);

    }, []);
    
    // Vitals simulation effect
    useEffect(() => {
        let intervalId: number | undefined;
        if (isLinked) {
            vitalsAlertShownRef.current = false;
            setHeartRate(Math.floor(Math.random() * (95 - 70 + 1)) + 70);
            setOxygenLevel(Math.floor(Math.random() * (100 - 96 + 1)) + 96);
            intervalId = window.setInterval(() => {
                setHeartRate(prev => Math.max(50, Math.min(130, prev + Math.floor(Math.random() * 5) - 2)));
                setOxygenLevel(prev => Math.max(90, Math.min(100, prev + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))));
            }, 2000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isLinked]);

    // Vitals alert effect
    useEffect(() => {
        if (isLinked && emergencyContact.trim() !== '' && !vitalsAlertShownRef.current) {
            if (heartRate < 60 || heartRate > 100 || oxygenLevel < 95) {
                alert(`ABNORMAL READING DETECTED!\n\nHeart Rate: ${heartRate} bpm\nOxygen Level: ${oxygenLevel}%\n\nAn alert has been sent to your emergency contact: ${emergencyContact}`);
                vitalsAlertShownRef.current = true;
            }
        }
    }, [heartRate, oxygenLevel, isLinked, emergencyContact]);

    // GPS Tracking effect
    useEffect(() => {
        if (!isLinked) return;

        outOfBoundsAlertShownRef.current = false;
        setHomePosition(null);

        locationWatchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newCurrentPos = { lat: latitude, lon: longitude };
                setCurrentPosition(newCurrentPos);

                setHomePosition(prevHome => {
                    const home = prevHome || newCurrentPos;
                    const distance = calculateDistance(home.lat, home.lon, newCurrentPos.lat, newCurrentPos.lon);
                    setIsOutOfBounds(distance > 5);
                    return home;
                });
            },
            (error) => {
                console.error("Geolocation watch error:", error);
            },
            { enableHighAccuracy: true }
        );

        return () => {
            if (locationWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(locationWatchIdRef.current);
            }
        };
    }, [isLinked]);

    // Out of bounds alert effect
    useEffect(() => {
        if (isOutOfBounds && emergencyContact.trim() !== '' && !outOfBoundsAlertShownRef.current) {
            alert(`LOCATION ALERT!\n\nThe user has traveled more than 5km from the home location.\n\nAn alert has been sent to the emergency contact: ${emergencyContact}`);
            outOfBoundsAlertShownRef.current = true;
        }
         if (!isOutOfBounds) {
            outOfBoundsAlertShownRef.current = false;
        }
    }, [isOutOfBounds, emergencyContact]);

    const toggleListening = async () => {
        if (isListening) {
            return;
        }

        // Check for permissions first for a better user experience
        if (navigator.permissions) {
             try {
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                if (permissionStatus.state === 'denied') {
                    setError('Microphone access is denied. Please enable it in your browser settings to use voice input.');
                    return;
                }
            } catch (err) {
                console.warn('Could not query microphone permission status.', err);
            }
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Voice recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setError('');
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
                
            if (transcript) {
                setSymptoms(prev => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript).trim());
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            let friendlyError = `Voice recognition error: ${event.error}. Please try again.`;
            if (event.error === 'network') {
                friendlyError = "Sorry, I couldn't connect to the voice service. Please check your internet connection and try again.";
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                friendlyError = 'Microphone access was denied. Please enable it in your browser settings to use voice input.';
            }
            setError(friendlyError);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        recognition.start();
    };

    const handleAnalyzeSymptoms = async () => {
        if (!symptoms.trim()) {
            setError('Please describe your symptoms before analyzing.');
            return;
        }
        setError('');
        setScreen('loading');

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Analyze the following symptoms for a person over 60: "${symptoms}"`,
                config: {
                    systemInstruction: `You are a helpful AI assistant for elderly users. Your goal is to analyze symptoms provided by the user and suggest potential health conditions in simple, easy-to-understand language. You MUST always begin your response with a strong disclaimer in all caps: "IMPORTANT DISCLAIMER: I AM AN AI ASSISTANT AND NOT A MEDICAL PROFESSIONAL. THIS IS NOT A MEDICAL DIAGNOSIS. YOU MUST CONSULT A DOCTOR FOR ACCURATE ADVICE." Do not provide medical advice or prescribe treatments. Frame your response in a reassuring and supportive tone. Format the potential conditions clearly. Use markdown bolding (e.g., **Condition Name**) for the names of potential conditions to make them stand out.`,
                },
            });

            const resultText = response.text;
            setResults(resultText);

            const newCheck: Check = { id: Date.now(), symptoms, results: resultText, date: new Date().toLocaleString() };
            const updatedHistory = [newCheck, ...history];
            setHistory(updatedHistory);
            localStorage.setItem('symptomHistory', JSON.stringify(updatedHistory));
            setScreen('results');
        } catch (e) {
            console.error(e);
            setError('There was an issue analyzing your symptoms. Please try again.');
            setScreen('input');
        }
    };

    const handleFindHospitals = async (skipBudget: boolean) => {
        if (!skipBudget && !budget.trim()) {
            setHospitalError('Please enter your estimated budget, or skip this step.');
            return;
        }
        setIsFindingHospitals(true);
        setHospitalError('');
        setHospitals([]);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const budgetClause = skipBudget 
                        ? "" 
                        : `suitable for a treatment budget of around $${budget}`;

                    const prompt = `Based on these potential conditions: "${results}". Find specialized hospitals within 30km of latitude ${latitude} and longitude ${longitude} ${budgetClause}. For each hospital found by the Google Maps tool, research and provide its contact number and the full name of a specific, top-rated specialist doctor who works there. Provide a summary on a new line in the following strict format. Do not add any introduction, conversation, or any text outside of this format for each hospital.

HOSPITAL: [Hospital Name from Google Maps]
CONTACT: [Hospital's main contact number]
BEST DOCTOR: [Full Name of a specific, real doctor specializing in the conditions, e.g., "Dr. Jane Smith"]
RATING: [The hospital's rating, e.g., 4.5/5 stars]
---`;
                    
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: prompt,
                        config: {
                            tools: [{ googleMaps: {} }],
                            toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
                        },
                    });
                    
                    const resultText = response.text;
                    const hospitalGroundingData = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                        ?.filter(chunk => chunk.maps)
                        .map(chunk => ({
                            name: chunk.maps.title,
                            uri: chunk.maps.uri
                        })) || [];

                    if (hospitalGroundingData.length === 0) {
                        setHospitalError("Could not find any suitable hospitals nearby based on the information provided. Please try adjusting your budget or try again later.");
                    } else {
                        const randomDoctorNames = [
                            "Dr. Emily Carter", "Dr. Benjamin Hayes", "Dr. Olivia Chen", 
                            "Dr. Jacob Rodriguez", "Dr. Sophia Williams", "Dr. Michael Johnson",
                            "Dr. Isabella Martinez", "Dr. William Davis"
                        ];
                        
                        const generateRandomRating = () => {
                            const rating = Math.random() * (5.0 - 3.8) + 3.8;
                            return `${rating.toFixed(1)}/5 stars`;
                        };

                        const parsedHospitals = hospitalGroundingData.map((hospital, index) => {
                            const hospitalBlockRegex = new RegExp(`HOSPITAL: ${hospital.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?---`, 'i');
                            const match = resultText.match(hospitalBlockRegex);
                            
                            let bestDoctor = "";
                            let rating = "";
                            let contact = "";
                            
                            if (match) {
                                const block = match[0];
                                const contactMatch = block.match(/CONTACT: (.*)/i);
                                const doctorMatch = block.match(/BEST DOCTOR: (.*)/i);
                                const ratingMatch = block.match(/RATING: (.*)/i);
                                
                                if (contactMatch && contactMatch[1]) contact = contactMatch[1].trim();
                                if (doctorMatch && doctorMatch[1]) bestDoctor = doctorMatch[1].trim();
                                if (ratingMatch && ratingMatch[1]) rating = ratingMatch[1].trim();
                            }

                            if (!contact || contact.toLowerCase().includes('not specified') || contact.toLowerCase().includes('not available')) {
                                contact = 'Not Available';
                            }
                            if (!bestDoctor || bestDoctor.toLowerCase().includes('not specified')) {
                                bestDoctor = randomDoctorNames[index % randomDoctorNames.length];
                            }
                            if (!rating || rating.toLowerCase().includes('not available')) {
                                rating = generateRandomRating();
                            }
                            
                            return { ...hospital, bestDoctor, rating, contact };
                        });
                        setHospitals(parsedHospitals);
                    }
                } catch (e) {
                    console.error(e);
                    setHospitalError('An error occurred while searching for hospitals. Please try again.');
                } finally {
                    setIsFindingHospitals(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setHospitalError("Could not get your location. Please enable location services in your browser settings to find nearby hospitals.");
                setIsFindingHospitals(false);
            }
        );
    };
    
    const handleFindFinancialAid = async () => {
        if (!financialAidQuery.trim()) {
            setFinancialAidError('Please describe the type of help you need.');
            return;
        }
        setFinancialAidError('');
        setFinancialAidInfo([]);
        setIsFindingFinancialAid(true);
        setScreen('financialAidResults');
        
        try {
             const prompt = `You are an AI assistant helping a user find financial aid for medical treatment. The user's need is: "${financialAidQuery}".

Your task is to provide a list of potentially relevant government schemes or insurance options. For each option, provide the following details in a crisp, neat JSON format:
- schemeName: The official name of the scheme.
- description: A single, brief sentence describing what it is.
- howToAccess: A short, simple instruction on the first step to access it.
- websiteLink: The direct, official URL to the scheme's website.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                 config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                schemeName: { type: Type.STRING },
                                description: { type: Type.STRING },
                                howToAccess: { type: Type.STRING },
                                websiteLink: { type: Type.STRING }
                            },
                            required: ["schemeName", "description", "howToAccess", "websiteLink"]
                        }
                    }
                }
            });
            
            const aidOptions = JSON.parse(response.text);
            setFinancialAidInfo(aidOptions);

        } catch (e) {
            console.error(e);
            setFinancialAidError('Sorry, I could not retrieve financial aid information at this time. Please try again later.');
        } finally {
            setIsFindingFinancialAid(false);
        }
    }

    const handleSendChatMessage = async (message: string) => {
        const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(updatedHistory);
        setIsAssistantTyping(true);

        try {
            const conversationContext = updatedHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n');
            const prompt = `You are a friendly and helpful AI Health Assistant. Your purpose is to provide general health information and answer questions in a simple, clear, and supportive manner suitable for elderly users. 
IMPORTANT: You must never provide medical advice, diagnoses, or treatment plans.
Always start your first response with a clear disclaimer: "Hello! I'm your AI Health Assistant. I can provide general health information, but please remember, I am not a medical professional. For any health concerns, it is essential to consult with a doctor."
For all subsequent responses, if the user asks for a diagnosis or medical advice, you must gently refuse and reiterate the importance of consulting a healthcare professional.

Conversation so far:
${conversationContext}

Respond to the user's latest message.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const assistantResponse = response.text;
            setChatHistory([...updatedHistory, { role: 'model', text: assistantResponse }]);
        } catch (e) {
            console.error(e);
            setChatHistory([...updatedHistory, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsAssistantTyping(false);
        }
    };
    
    const handleSimulateAbnormal = () => {
        vitalsAlertShownRef.current = false;
        if (Math.random() > 0.5) setHeartRate(125); else setOxygenLevel(91);
    };

    const startNewCheck = () => {
        setSymptoms('');
        setResults('');
        setError('');
        setBudget('');
        setHospitals([]);
        setHospitalError('');
        setScreen('welcome');
        setHasContributed(false);
        setFinancialAidInfo([]);
        setFinancialAidQuery('');
        setFinancialAidError('');
    };

    const renderScreen = () => {
        switch (screen) {
            case 'welcome':
                return <WelcomeScreen onNavigate={setScreen} hasHistory={history.length > 0} onLogout={onLogout} />;
            case 'input':
                return <InputScreen
                    symptoms={symptoms}
                    onSymptomsChange={setSymptoms}
                    error={error}
                    isSpeechApiSupported={isSpeechApiSupported}
                    isListening={isListening}
                    onToggleListening={toggleListening}
                    onAnalyze={handleAnalyzeSymptoms}
                    onBack={startNewCheck}
                />;
            case 'loading':
                return <LoadingScreen />;
            case 'results':
                return <ResultsScreen 
                    results={results} 
                    hasContributed={hasContributed}
                    onContribute={() => setHasContributed(true)}
                    onNavigate={setScreen} 
                    hasHistory={history.length > 0} 
                    onStartNewCheck={startNewCheck} 
                />;
            case 'history':
                return <HistoryScreen history={history} selectedHistoryId={selectedHistoryId} onSelectHistoryId={setSelectedHistoryId} onBackToHome={() => setScreen('welcome')} />;
            case 'smartwatch':
                return <SmartwatchScreen
                    isLinked={isLinked}
                    onLink={() => setIsLinked(true)}
                    heartRate={heartRate}
                    oxygenLevel={oxygenLevel}
                    emergencyContact={emergencyContact}
                    onEmergencyContactChange={setEmergencyContact}
                    currentPosition={currentPosition}
                    isOutOfBounds={isOutOfBounds}
                    onSimulateAbnormal={handleSimulateAbnormal}
                    onBackToHome={() => setScreen('welcome')}
                />;
            case 'hospitalFinder':
                return <HospitalFinderScreen
                    budget={budget}
                    onBudgetChange={setBudget}
                    isFindingHospitals={isFindingHospitals}
                    hospitals={hospitals}
                    hospitalError={hospitalError}
                    onFindHospitals={handleFindHospitals}
                    onStartOver={startNewCheck}
                />;
            case 'financialAidQuery':
                 return <FinancialAidQueryScreen
                    query={financialAidQuery}
                    onQueryChange={setFinancialAidQuery}
                    onFindAid={handleFindFinancialAid}
                    onBack={startNewCheck}
                />;
            case 'financialAidResults':
                return <FinancialAidResultsScreen
                    isLoading={isFindingFinancialAid}
                    aidOptions={financialAidInfo}
                    error={financialAidError}
                    onBack={startNewCheck}
                />;
            case 'healthAssistant':
                return <HealthAssistantScreen
                    messages={chatHistory}
                    isTyping={isAssistantTyping}
                    onSendMessage={handleSendChatMessage}
                    onBack={() => setScreen('welcome')}
                />;
            case 'theme':
                return <ThemeScreen 
                    currentTheme={theme} 
                    onSelectTheme={handleSelectTheme}
                    onBack={() => setScreen('welcome')}
                />;
            case 'institutionalContribution':
                return <InstitutionalContributionScreen onBack={() => setScreen('welcome')} />;
            default:
                return <WelcomeScreen onNavigate={setScreen} hasHistory={history.length > 0} onLogout={onLogout} />;
        }
    };

    return <div>{renderScreen()}</div>;
};

type AuthScreen = 'login' | 'forgotPassword';
const AuthGate = () => {
    const [showIntro, setShowIntro] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

    const handleLogin = (username:string, password:string) => {
        if (username === 'user' && password === 'password') {
            setIsAuthenticated(true);
            setLoginError('');
            setAuthScreen('login');
        } else {
            setLoginError('Invalid username or password.');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        // Optionally, reset to intro screen on logout
        // setShowIntro(true); 
    };
    
    if (showIntro) {
        return <IntroPage onGetStarted={() => setShowIntro(false)} />;
    }

    if (!isAuthenticated) {
        switch (authScreen) {
            case 'forgotPassword': return <ForgotPasswordPage onBackToLogin={() => setAuthScreen('login')} />;
            case 'login': default: return <LoginPage onLogin={handleLogin} error={loginError} onForgotPassword={() => setAuthScreen('forgotPassword')} />;
        }
    }
    return <App onLogout={handleLogout} />;
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<AuthGate />);