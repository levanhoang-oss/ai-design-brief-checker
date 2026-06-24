import React, { useState } from 'react';
import { scoreToRating } from '../utils/reviewEngine';
import './ReviewReport.css';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'brief', label: 'Brief' },
  { id: 'strengths', label: 'Strengths & Gaps' },
  { id: 'stakeholders', label: 'Stakeholders' },
  { id: 'site', label: 'Site' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'heritage', label: 'Heritage' },
  { id: 'risks', label: 'Risks' },
  { id: 'recommendations', label: 'Recommendations' },
];

function ScoreBar({ score, size = 'normal' }) {
  const { colour } = scoreToRating(score);
  return (
    <div className={`score-bar-wrap ${size}`}>
      <div
        className={`score-bar-fill c-${colour}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function ScoreBadge({ score }) {
  const { label, colour } = scoreToRating(score);
  return (
    <span className={`score-badge badge-${colour}`}>
      {score}/100 — {label}
    </span>
  );
}

function VerdictChip({ verdict, colour }) {
  return <span className={`verdict-chip verdict-${colour}`}>{verdict}</span>;
}

function StakeholderBadge({ verdict }) {
  const map = { 'Met': 'green', 'Partially Met': 'amber', 'Not Met': 'red' };
  const c = map[verdict] || 'amber';
  return <span className={`inline-badge badge-${c}`}>{verdict}</span>;
}

function RiskBadge({ level }) {
  const map = { High: 'red', Medium: 'amber', Low: 'green' };
  const c = map[level] || 'amber';
  return <span className={`inline-badge badge-${c}`}>{level}</span>;
}

function PriorityBadge({ priority }) {
  const map = { Critical: 'red', Important: 'amber', Advisory: 'blue' };
  const c = map[priority] || 'amber';
  return <span className={`inline-badge badge-${c}`}>{priority}</span>;
}

export default function ReviewReport({ report }) {
  const [activeTab, setActiveTab] = useState('summary');

  const { meta, scores, briefAlignment, strengths, weaknesses, missingRequirements,
    stakeholders, siteResponse, accessibilityReview, sustainabilityReview,
    heritageReview, risks, recommendations, overallAssessment } = report;

  return (
    <div className="review-report">

      {/* ── Report Header ── */}
      <div className="report-header">
        <div className="report-header-left">
          <div className="report-eyebrow">Design review report</div>
          <h1 className="report-project-name">{meta.projectName}</h1>
          <div className="report-tags">
            <span className="rtag">{meta.projectType}</span>
            <span className="rtag">{meta.projectStage}</span>
            <span className="rtag">{meta.reviewFocus}</span>
          </div>
          <div className="report-meta-line">
            {meta.reviewDate} &nbsp;·&nbsp; {meta.generatedBy}
          </div>
        </div>
        <div className="report-score-block">
          <div className={`score-circle sc-${overallAssessment.colour}`}>
            <span className="score-number">{scores.overall}</span>
            <span className="score-denom">/100</span>
          </div>
          <VerdictChip verdict={overallAssessment.verdict} colour={overallAssessment.colour} />
        </div>
      </div>

      {/* ── Score Grid ── */}
      <div className="score-grid">
        {[
          { label: 'Brief alignment', score: scores.briefAlignment },
          { label: 'Stakeholders', score: scores.stakeholders },
          { label: 'Site response', score: scores.site },
          { label: 'Accessibility', score: scores.accessibility },
          { label: 'Sustainability', score: scores.sustainability },
          { label: 'Heritage', score: scores.heritage },
        ].map(({ label, score }) => {
          const { colour } = scoreToRating(score);
          return (
            <div className="score-card" key={label}>
              <div className="score-card-label">{label}</div>
              <ScoreBar score={score} size="thin" />
              <div className={`score-card-value c-text-${colour}`}>{score}</div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-wrap" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Panels ── */}
      <div className="tab-content">

        {activeTab === 'summary' && (
          <div className="panel">
            <h2 className="panel-title">Executive summary</h2>
            <p className="panel-body">{overallAssessment.summary}</p>

            <div className="summary-stats">
              <div className="stat-card">
                <div className="stat-num green">{strengths.length}</div>
                <div className="stat-label">Strengths</div>
              </div>
              <div className="stat-card">
                <div className="stat-num amber">{weaknesses.length}</div>
                <div className="stat-label">Weaknesses</div>
              </div>
              <div className="stat-card">
                <div className="stat-num red">{missingRequirements.length}</div>
                <div className="stat-label">Missing requirements</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{risks.length}</div>
                <div className="stat-label">Design risks</div>
              </div>
            </div>

            <div className="callout-box">
              <strong>Overall assessment:</strong> {overallAssessment.verdict} — {scores.overall}/100.{' '}
              {scores.overall < 55 && 'This proposal requires significant further development before progressing to the next design stage.'}
              {scores.overall >= 55 && scores.overall < 75 && 'Key gaps identified above should be addressed before schematic design proceeds.'}
              {scores.overall >= 75 && 'The proposal is well-developed. Address the recommendations above to strengthen the submission.'}
            </div>
          </div>
        )}

        {activeTab === 'brief' && (
          <div className="panel">
            <h2 className="panel-title">Alignment with design brief</h2>

            {briefAlignment.fully.length > 0 && (
              <div className="alignment-group">
                <div className="alignment-head green-head">
                  <span className="dot green-dot" aria-hidden="true" />
                  Fully addressed ({briefAlignment.fully.length})
                </div>
                <ul className="alignment-list">
                  {briefAlignment.fully.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

            {briefAlignment.partially.length > 0 && (
              <div className="alignment-group">
                <div className="alignment-head amber-head">
                  <span className="dot amber-dot" aria-hidden="true" />
                  Partially addressed ({briefAlignment.partially.length})
                </div>
                <ul className="alignment-list">
                  {briefAlignment.partially.map((item, i) => (
                    <li key={i}>
                      <span className="item-title">{item.item}</span>
                      <span className="item-concern">↳ {item.concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {briefAlignment.missing.length > 0 && (
              <div className="alignment-group">
                <div className="alignment-head red-head">
                  <span className="dot red-dot" aria-hidden="true" />
                  Not addressed ({briefAlignment.missing.length})
                </div>
                <ul className="alignment-list">
                  {briefAlignment.missing.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'strengths' && (
          <div className="panel">
            <h2 className="panel-title">Strengths, weaknesses &amp; missing requirements</h2>

            <div className="two-col-findings">
              <div>
                <h3 className="findings-subhead green-text">Strengths ({strengths.length})</h3>
                <ul className="findings-list">
                  {strengths.map((s, i) => <li key={i}><span className="finding-dot green-dot" />  {s}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="findings-subhead amber-text">Weaknesses ({weaknesses.length})</h3>
                <ul className="findings-list">
                  {weaknesses.map((w, i) => <li key={i}><span className="finding-dot amber-dot" />  {w}</li>)}
                </ul>
              </div>
            </div>

            {missingRequirements.length > 0 && (
              <div className="missing-block">
                <h3 className="findings-subhead red-text">Missing requirements ({missingRequirements.length})</h3>
                <ul className="findings-list">
                  {missingRequirements.map((m, i) => <li key={i}><span className="finding-dot red-dot" />  {m}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stakeholders' && (
          <div className="panel">
            <h2 className="panel-title">Stakeholder review</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stakeholder</th>
                    <th>Requirement</th>
                    <th>Design response</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {stakeholders.map((row, i) => (
                    <tr key={i}>
                      <td className="td-name">{row.name}</td>
                      <td>{row.requirement}</td>
                      <td>{row.response}</td>
                      <td><StakeholderBadge verdict={row.verdict} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'site' && (
          <CategoryPanel
            title="Site response review"
            data={siteResponse}
            scoreLabel="Site response"
          />
        )}

        {activeTab === 'accessibility' && (
          <CategoryPanel
            title="Accessibility review"
            data={accessibilityReview}
            scoreLabel="Accessibility"
          />
        )}

        {activeTab === 'sustainability' && (
          <CategoryPanel
            title="Sustainability review"
            data={sustainabilityReview}
            scoreLabel="Sustainability"
          />
        )}

        {activeTab === 'heritage' && (
          <CategoryPanel
            title="Heritage &amp; cultural review"
            data={heritageReview}
            scoreLabel="Heritage"
          />
        )}

        {activeTab === 'risks' && (
          <div className="panel">
            <h2 className="panel-title">Design risks</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Risk</th>
                    <th>Description</th>
                    <th>Likelihood</th>
                    <th>Impact</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map((risk, i) => (
                    <tr key={i}>
                      <td className="td-num">{i + 1}</td>
                      <td className="td-name">{risk.risk}</td>
                      <td>{risk.description}</td>
                      <td><RiskBadge level={risk.likelihood} /></td>
                      <td><RiskBadge level={risk.impact} /></td>
                      <td>
                        <RiskBadge level={
                          risk.likelihood === 'High' && risk.impact === 'High' ? 'High' :
                          risk.likelihood === 'Low' && risk.impact === 'Low' ? 'Low' : 'Medium'
                        } />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="panel">
            <h2 className="panel-title">Recommendations</h2>
            <div className="rec-list">
              {recommendations.map((rec, i) => (
                <div className="rec-item" key={i}>
                  <div className="rec-header">
                    <span className="rec-num">{i + 1}</span>
                    <PriorityBadge priority={rec.priority} />
                    <span className="rec-category">{rec.category}</span>
                  </div>
                  <div className="rec-title">{rec.title}</div>
                  <p className="rec-body">{rec.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function CategoryPanel({ title, data, scoreLabel }) {
  return (
    <div className="panel">
      <h2 className="panel-title" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="cat-score-row">
        <span className="cat-score-label">{scoreLabel} score:</span>
        <ScoreBadge score={data.score} />
      </div>
      <ScoreBar score={data.score} size="normal" />
      <p className="panel-body" style={{ marginTop: '1rem' }}>{data.findings}</p>
      {data.observations?.length > 0 && (
        <>
          <h3 className="sub-section-head">Observations</h3>
          <ul className="obs-list">
            {data.observations.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
