import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ReviewReport from './components/ReviewReport';
import Header from './components/Header';
import { generateReview } from './utils/reviewEngine';
import './App.css';

export default function App() {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState(null);

  function handleGenerate(data) {
    setIsGenerating(true);
    setFormData(data);
    // Small delay to show the loading state
    setTimeout(() => {
      const result = generateReview(data);
      setReport(result);
      setIsGenerating(false);
      // Scroll to report
      setTimeout(() => {
        document.getElementById('report-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 800);
  }

  function handleClear() {
    setReport(null);
    setFormData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app">
      <Header />
      <main className="main-layout">
        <section className="form-column">
          <InputForm
            onGenerate={handleGenerate}
            onClear={handleClear}
            isGenerating={isGenerating}
            hasReport={!!report}
          />
        </section>
        <section className="report-column">
          <div id="report-anchor" />
          {isGenerating && <LoadingState />}
          {!isGenerating && report && <ReviewReport report={report} />}
          {!isGenerating && !report && <EmptyState />}
        </section>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="6" width="24" height="30" rx="2" stroke="#4a7fc1" strokeWidth="1.5" fill="none" />
          <path d="M10 14h12M10 19h12M10 24h8" stroke="#4a7fc1" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="30" cy="30" r="8" fill="#132040" stroke="#4a7fc1" strokeWidth="1.5" />
          <path d="M27 30h6M30 27v6" stroke="#4a7fc1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3>Review report will appear here</h3>
      <p>Complete the project brief form on the left and click <strong>Generate Review</strong> to produce a structured design assessment.</p>
      <ul className="empty-checklist">
        <li>Fill in your project details</li>
        <li>Paste your design brief</li>
        <li>Add your concept statement</li>
        <li>Include optional strategies for a richer review</li>
      </ul>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" aria-hidden="true" />
      <h3>Analysing your submission…</h3>
      <p>Evaluating brief alignment, site response, and specialist strategies.</p>
    </div>
  );
}
