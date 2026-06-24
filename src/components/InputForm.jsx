import React, { useState } from 'react';
import './InputForm.css';

const EMPTY_FORM = {
  projectName: '',
  projectType: '',
  projectStage: '',
  reviewFocus: '',
  brief: '',
  concept: '',
  siteContext: '',
  stakeholders: '',
  sustainStrategy: '',
  accessStrategy: '',
  heritageContext: '',
};

const REQUIRED_FIELDS = ['projectName', 'projectType', 'projectStage', 'reviewFocus', 'brief', 'concept'];

export default function InputForm({ onGenerate, onClear, isGenerating, hasReport }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showOptional, setShowOptional] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit() {
    if (!isValid()) return;
    onGenerate(form);
  }

  function handleClear() {
    setForm(EMPTY_FORM);
    setShowOptional(false);
    onClear();
  }

  function isValid() {
    return REQUIRED_FIELDS.every(f => form[f].trim().length > 0);
  }

  const completedRequired = REQUIRED_FIELDS.filter(f => form[f].trim().length > 0).length;
  const progressPct = Math.round((completedRequired / REQUIRED_FIELDS.length) * 100);

  return (
    <div className="input-form">
      {/* Form header */}
      <div className="form-header">
        <h2 className="form-title">Project Submission</h2>
        <p className="form-subtitle">Complete all required fields to generate your design review report.</p>
        <div className="progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progress-label">{completedRequired}/{REQUIRED_FIELDS.length} required</span>
        </div>
      </div>

      <div className="form-body">

        {/* Section 1 – Identity */}
        <fieldset className="form-section">
          <legend className="section-label">Project identity</legend>

          <div className="field">
            <label htmlFor="projectName">Project name <span className="req">*</span></label>
            <input
              id="projectName"
              name="projectName"
              type="text"
              value={form.projectName}
              onChange={handleChange}
              placeholder="e.g. Civic Library Redevelopment"
              autoComplete="off"
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="projectType">Project type <span className="req">*</span></label>
              <select id="projectType" name="projectType" value={form.projectType} onChange={handleChange}>
                <option value="">Select…</option>
                <option>Architecture</option>
                <option>Urban Design</option>
                <option>Interior Design</option>
                <option>Landscape Architecture</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="projectStage">Project stage <span className="req">*</span></label>
              <select id="projectStage" name="projectStage" value={form.projectStage} onChange={handleChange}>
                <option value="">Select…</option>
                <option>Concept Design</option>
                <option>Schematic Design</option>
                <option>Design Development</option>
                <option>Final Proposal</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="reviewFocus">Review focus <span className="req">*</span></label>
            <select id="reviewFocus" name="reviewFocus" value={form.reviewFocus} onChange={handleChange}>
              <option value="">Select…</option>
              <option>Design Brief Compliance</option>
              <option>Stakeholder Alignment</option>
              <option>Accessibility</option>
              <option>Sustainability</option>
              <option>Heritage</option>
              <option>All Categories</option>
            </select>
          </div>
        </fieldset>

        {/* Section 2 – Core content */}
        <fieldset className="form-section">
          <legend className="section-label">Design brief &amp; intent</legend>

          <div className="field">
            <label htmlFor="brief">
              Design brief <span className="req">*</span>
              <span className="field-hint">{form.brief.trim().split(/\s+/).filter(Boolean).length} words</span>
            </label>
            <textarea
              id="brief"
              name="brief"
              rows={6}
              value={form.brief}
              onChange={handleChange}
              placeholder="Paste or summarise the project brief here. Include objectives, constraints, performance requirements, and any mandatory criteria."
            />
          </div>

          <div className="field">
            <label htmlFor="concept">
              Concept statement <span className="req">*</span>
              <span className="field-hint">{form.concept.trim().split(/\s+/).filter(Boolean).length} words</span>
            </label>
            <textarea
              id="concept"
              name="concept"
              rows={5}
              value={form.concept}
              onChange={handleChange}
              placeholder="Describe your design concept and intent. How does your design respond to the brief?"
            />
          </div>
        </fieldset>

        {/* Section 3 – Optional strategies */}
        <div className="optional-toggle">
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowOptional(!showOptional)}
            aria-expanded={showOptional}
          >
            <span className="toggle-icon">{showOptional ? '▾' : '▸'}</span>
            Optional strategies &amp; context
            <span className="toggle-hint">Site, stakeholders, sustainability, accessibility, heritage</span>
          </button>
        </div>

        {showOptional && (
          <fieldset className="form-section optional-section">
            <legend className="section-label">Context &amp; strategies</legend>

            <div className="field">
              <label htmlFor="siteContext">Site context</label>
              <textarea
                id="siteContext"
                name="siteContext"
                rows={4}
                value={form.siteContext}
                onChange={handleChange}
                placeholder="Describe the site: location, orientation, neighbouring context, constraints, and opportunities."
              />
            </div>

            <div className="field">
              <label htmlFor="stakeholders">Stakeholders</label>
              <textarea
                id="stakeholders"
                name="stakeholders"
                rows={3}
                value={form.stakeholders}
                onChange={handleChange}
                placeholder="List key stakeholders and their specific requirements or expectations."
              />
            </div>

            <div className="field">
              <label htmlFor="sustainStrategy">Sustainability strategy</label>
              <textarea
                id="sustainStrategy"
                name="sustainStrategy"
                rows={3}
                value={form.sustainStrategy}
                onChange={handleChange}
                placeholder="Describe your sustainability approach: passive design, energy systems, water management, rating targets."
              />
            </div>

            <div className="field">
              <label htmlFor="accessStrategy">Accessibility strategy</label>
              <textarea
                id="accessStrategy"
                name="accessStrategy"
                rows={3}
                value={form.accessStrategy}
                onChange={handleChange}
                placeholder="Describe your universal design approach and how you address AS 1428 compliance."
              />
            </div>

            <div className="field">
              <label htmlFor="heritageContext">Heritage &amp; cultural considerations</label>
              <textarea
                id="heritageContext"
                name="heritageContext"
                rows={3}
                value={form.heritageContext}
                onChange={handleChange}
                placeholder="Note any heritage overlays, cultural significance, or sensitive context."
              />
            </div>
          </fieldset>
        )}

      </div>

      {/* Footer actions */}
      <div className="form-footer">
        <button
          type="button"
          className="btn-clear"
          onClick={handleClear}
          disabled={isGenerating}
        >
          Clear form
        </button>
        <button
          type="button"
          className="btn-generate"
          onClick={handleSubmit}
          disabled={!isValid() || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Analysing…
            </>
          ) : (
            'Generate review →'
          )}
        </button>
      </div>
    </div>
  );
}
