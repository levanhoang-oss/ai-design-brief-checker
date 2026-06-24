/**
 * reviewEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based design review logic.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  AI INTEGRATION POINT                                                   │
 * │  To replace this with a real Claude API call, see the function          │
 * │  generateReviewWithClaude() at the bottom of this file.                 │
 * │  Swap the call in generateReview() from analyseLocally() to             │
 * │  generateReviewWithClaude() and provide your API key.                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// ─── Keyword dictionaries ──────────────────────────────────────────────────

const SUSTAINABILITY_KEYWORDS = [
  'passive solar', 'natural ventilation', 'cross ventilation', 'solar panels',
  'photovoltaic', 'pv array', 'rainwater', 'greywater', 'green roof', 'living wall',
  'thermal mass', 'insulation', 'double glazing', 'energy efficiency', 'carbon',
  'embodied carbon', 'green star', 'nabers', 'net zero', 'low carbon', 'biophilic',
  'daylight', 'daylighting', 'shading', 'brise soleil', 'esd', 'sustainable',
  'renewable', 'solar gain', 'heat pump', 'recycled materials', 'leed',
];

const ACCESSIBILITY_KEYWORDS = [
  'accessible', 'accessibility', 'universal design', 'wheelchair', 'ramp',
  'lift', 'elevator', 'hearing loop', 'braille', 'tactile', 'wayfinding',
  'step-free', 'dda', 'as 1428', 'disability', 'mobility', 'inclusive',
  'ambulant', 'sensory', 'visual impairment', 'hearing impairment', 'handrail',
  'ambulant stair', 'accessible parking', 'audio description',
];

const HERITAGE_KEYWORDS = [
  'heritage', 'historic', 'historical', 'conservation', 'listed building',
  'national trust', 'cultural', 'indigenous', 'aboriginal', 'first nations',
  'traditional owners', 'significance', 'character', 'context', 'vernacular',
  'materiality', 'brick', 'masonry', 'facade', 'rhythm', 'scale', 'proportions',
  'curtilage', 'overlay', 'hia', 'heritage impact',
];

const SITE_KEYWORDS = [
  'north', 'south', 'east', 'west', 'orientation', 'solar', 'prevailing wind',
  'topography', 'slope', 'contour', 'view', 'vista', 'neighbouring', 'adjacent',
  'setback', 'boundary', 'pedestrian', 'vehicle', 'access', 'entry', 'threshold',
  'street', 'public realm', 'landscape', 'garden', 'courtyard', 'terrace',
  'flood', 'drainage', 'ground level', 'datum',
];

const STAKEHOLDER_KEYWORDS = [
  'community', 'user', 'client', 'resident', 'tenant', 'visitor', 'staff',
  'student', 'public', 'pedestrian', 'cyclist', 'consultation', 'engagement',
  'requirement', 'need', 'brief', 'program', 'spatial', 'accommodation',
];

// ─── Helper utilities ─────────────────────────────────────────────────────

function countKeywords(text, keywords) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw)).length;
}

function hasContent(text, minWords = 20) {
  if (!text) return false;
  return text.trim().split(/\s+/).length >= minWords;
}

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function scoreToRating(score) {
  if (score >= 85) return { label: 'Excellent', colour: 'green' };
  if (score >= 70) return { label: 'Good', colour: 'green' };
  if (score >= 55) return { label: 'Adequate', colour: 'amber' };
  if (score >= 35) return { label: 'Partial', colour: 'amber' };
  return { label: 'Insufficient', colour: 'red' };
}

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

// ─── Category scorers ─────────────────────────────────────────────────────

function scoreBriefAlignment(brief, concept) {
  if (!brief || !concept) return 15;
  const briefWords = wordCount(brief);
  const conceptWords = wordCount(concept);
  let score = 30;
  if (briefWords > 50) score += 10;
  if (briefWords > 150) score += 10;
  if (conceptWords > 50) score += 15;
  if (conceptWords > 150) score += 15;
  // Check if concept references brief content
  const briefTerms = brief.toLowerCase().split(/\W+/).filter(w => w.length > 5);
  const conceptLower = concept.toLowerCase();
  const overlap = briefTerms.filter(t => conceptLower.includes(t)).length;
  score += Math.min(20, overlap * 2);
  return clamp(score);
}

function scoreStakeholders(stakeholders, concept) {
  if (!stakeholders) return 20;
  const kwCount = countKeywords(stakeholders, STAKEHOLDER_KEYWORDS);
  let score = 25 + Math.min(35, kwCount * 5);
  if (hasContent(stakeholders, 40)) score += 15;
  if (concept && countKeywords(concept, STAKEHOLDER_KEYWORDS) > 0) score += 10;
  return clamp(score);
}

function scoreSite(siteContext, concept) {
  const siteKw = countKeywords(siteContext, SITE_KEYWORDS);
  const conceptKw = countKeywords(concept, SITE_KEYWORDS);
  let score = 20;
  score += Math.min(30, siteKw * 5);
  score += Math.min(25, conceptKw * 4);
  if (hasContent(siteContext, 30)) score += 10;
  if (hasContent(concept, 50)) score += 10;
  return clamp(score);
}

function scoreAccessibility(accessStrategy, concept) {
  const stratKw = countKeywords(accessStrategy, ACCESSIBILITY_KEYWORDS);
  const conceptKw = countKeywords(concept, ACCESSIBILITY_KEYWORDS);
  let score = 10;
  if (!accessStrategy) return score;
  score += Math.min(40, stratKw * 8);
  score += Math.min(20, conceptKw * 5);
  if (hasContent(accessStrategy, 30)) score += 15;
  return clamp(score);
}

function scoreSustainability(sustainStrategy, concept) {
  const stratKw = countKeywords(sustainStrategy, SUSTAINABILITY_KEYWORDS);
  const conceptKw = countKeywords(concept, SUSTAINABILITY_KEYWORDS);
  let score = 10;
  if (!sustainStrategy) return score;
  score += Math.min(40, stratKw * 6);
  score += Math.min(20, conceptKw * 4);
  if (hasContent(sustainStrategy, 30)) score += 15;
  return clamp(score);
}

function scoreHeritage(heritageContext, concept) {
  const heriKw = countKeywords(heritageContext, HERITAGE_KEYWORDS);
  const conceptKw = countKeywords(concept, HERITAGE_KEYWORDS);
  let score = 30; // neutral baseline — not every project has heritage obligations
  if (!heritageContext) return score;
  score += Math.min(35, heriKw * 6);
  score += Math.min(20, conceptKw * 4);
  if (hasContent(heritageContext, 20)) score += 10;
  return clamp(score);
}

// ─── Finding generators ───────────────────────────────────────────────────

function buildBriefAlignment(brief, concept, projectType) {
  const fully = [];
  const partially = [];
  const missing = [];

  if (hasContent(concept, 50)) {
    fully.push('Concept statement provides a legible design intent with sufficient narrative detail.');
  } else if (hasContent(concept, 15)) {
    partially.push({ item: 'Concept statement present but brief', concern: 'Expand to clarify how the design intent directly responds to each brief requirement.' });
  } else {
    missing.push('Concept statement — required to assess design intent against brief objectives.');
  }

  if (hasContent(brief, 100)) {
    fully.push('Design brief is detailed and provides a substantive basis for evaluation.');
  } else if (hasContent(brief, 30)) {
    partially.push({ item: 'Design brief provided but limited in scope', concern: 'Include performance criteria, spatial requirements, and mandatory standards.' });
  } else {
    missing.push('Comprehensive design brief — current submission is insufficient for full review.');
  }

  if (projectType === 'Architecture' || projectType === 'Interior Design') {
    if (countKeywords(concept, ['program', 'spatial', 'area', 'floor', 'room', 'space', 'accommodation']) > 0) {
      fully.push('Spatial program appears referenced within the concept response.');
    } else {
      partially.push({ item: 'Spatial program response', concern: 'Concept should explicitly address the required floor areas and spatial relationships.' });
    }
  }

  if (projectType === 'Urban Design' || projectType === 'Landscape Architecture') {
    if (countKeywords(concept, ['public', 'pedestrian', 'street', 'park', 'open space', 'movement', 'network']) > 0) {
      fully.push('Public realm and movement network referenced in concept response.');
    } else {
      partially.push({ item: 'Public realm strategy', concern: 'Urban and landscape projects should articulate how movement, activation, and open space are structured.' });
    }
  }

  return { fully, partially, missing };
}

function buildStrengths(data, scores) {
  const strengths = [];
  const { brief, concept, siteContext, sustainStrategy, accessStrategy, heritageContext } = data;

  if (scores.briefAlignment >= 65) strengths.push('Brief engagement: The concept demonstrates meaningful engagement with the design brief objectives.');
  if (scores.site >= 60 && hasContent(siteContext, 20)) strengths.push('Site analysis: Site context has been considered and appears to inform the design response.');
  if (scores.sustainability >= 60) strengths.push('Sustainability intent: Sustainability strategies are present and reference relevant environmental principles.');
  if (scores.accessibility >= 55) strengths.push('Accessibility awareness: Accessibility considerations have been integrated into the design approach.');
  if (scores.heritage >= 65 && hasContent(heritageContext, 20)) strengths.push('Contextual sensitivity: Heritage and cultural context has been acknowledged and referenced in the design.');
  if (scores.stakeholders >= 60) strengths.push('Stakeholder awareness: Key stakeholder groups and their requirements are identified.');
  if (wordCount(concept) > 200) strengths.push('Concept depth: The concept statement is substantive and provides a detailed articulation of design intent.');

  if (strengths.length === 0) {
    strengths.push('Submission received: A project submission has been made, providing a starting point for review.');
  }

  return strengths;
}

function buildWeaknesses(data, scores) {
  const weaknesses = [];
  const { brief, concept, siteContext, sustainStrategy, accessStrategy } = data;

  if (scores.briefAlignment < 55) weaknesses.push('Brief alignment is limited — the concept does not clearly demonstrate how it responds to the specific requirements of the brief.');
  if (scores.site < 50) weaknesses.push('Site response is underdeveloped — orientation, solar access, and contextual relationships are not adequately addressed.');
  if (scores.sustainability < 45) weaknesses.push('Sustainability strategy is insufficient — the submission lacks specific environmental targets and passive design principles.');
  if (scores.accessibility < 45) weaknesses.push('Accessibility strategy is absent or underdeveloped — universal design principles are not demonstrated.');
  if (scores.stakeholders < 45) weaknesses.push('Stakeholder requirements are not clearly addressed — the design does not demonstrate how user needs have shaped the proposal.');
  if (wordCount(concept) < 80) weaknesses.push('Concept statement is too brief — a stronger narrative is required to justify the design decisions made.');
  if (!hasContent(siteContext, 20)) weaknesses.push('Site context description is missing or insufficient — this is a fundamental requirement for site-responsive design.');

  if (weaknesses.length === 0) {
    weaknesses.push('No critical weaknesses identified at this stage. Minor refinements may be required at subsequent design stages.');
  }

  return weaknesses;
}

function buildMissingRequirements(data) {
  const missing = [];
  const { brief, concept, siteContext, stakeholders, sustainStrategy, accessStrategy, heritageContext, reviewFocus } = data;

  if (!hasContent(concept, 20)) missing.push('Concept statement — a substantive design concept is required to conduct a meaningful review.');
  if (!hasContent(siteContext, 20)) missing.push('Site context analysis — site constraints, orientation, and contextual relationships must be documented.');
  if (!hasContent(sustainStrategy, 15)) missing.push('Sustainability strategy — an ESD approach addressing passive design, energy, and water must be provided.');
  if (!hasContent(accessStrategy, 15)) missing.push('Accessibility strategy — a universal design approach demonstrating compliance with AS 1428 must be included.');
  if (!hasContent(stakeholders, 15)) missing.push('Stakeholder requirements — identification of key users and their specific spatial and functional needs.');

  const needsHeritage = heritageContext && countKeywords(heritageContext, ['heritage', 'historic', 'listed', 'overlay']) > 0;
  if (needsHeritage && !hasContent(heritageContext, 30)) {
    missing.push('Heritage impact statement — where a heritage overlay applies, a documented heritage response is required.');
  }

  if (reviewFocus === 'Sustainability' && countKeywords(sustainStrategy, ['green star', 'nabers', 'net zero', 'carbon']) === 0) {
    missing.push('ESD rating target — a specific rating target (e.g. 5-star Green Star) must be nominated and a credit map provided.');
  }

  return missing;
}

function buildRisks(data, scores) {
  const risks = [];

  if (scores.site < 45) {
    risks.push({ risk: 'Poor site response', description: 'Design may not respond adequately to site constraints, resulting in amenity, acoustic, or thermal performance issues.', likelihood: 'High', impact: 'High' });
  }
  if (scores.accessibility < 40) {
    risks.push({ risk: 'Accessibility non-compliance', description: 'Without a documented universal design strategy, the proposal risks non-compliance with DDA requirements and AS 1428.', likelihood: 'High', impact: 'High' });
  }
  if (scores.sustainability < 40) {
    risks.push({ risk: 'ESD target shortfall', description: 'Insufficient sustainability strategy may result in failure to achieve required rating, requiring costly design revision.', likelihood: 'Medium', impact: 'High' });
  }
  if (scores.briefAlignment < 50) {
    risks.push({ risk: 'Brief non-compliance at design development', description: 'Poor brief alignment at concept stage increases the risk of significant rework when technical requirements are resolved.', likelihood: 'Medium', impact: 'Medium' });
  }
  if (scores.stakeholders < 45) {
    risks.push({ risk: 'Stakeholder dissatisfaction', description: 'Without clear stakeholder alignment, the design may not meet user needs, leading to post-completion complaints or functional failure.', likelihood: 'Medium', impact: 'Medium' });
  }

  if (risks.length === 0) {
    risks.push({ risk: 'Detail resolution at later stages', description: 'No critical risks identified at concept stage. Standard risks associated with design development and technical coordination apply.', likelihood: 'Low', impact: 'Low' });
  }

  return risks;
}

function buildRecommendations(data, scores) {
  const recs = [];

  if (scores.accessibility < 55) {
    recs.push({ priority: 'Critical', title: 'Prepare a universal design strategy', explanation: 'Engage with AS 1428 and the Disability Discrimination Act 1992. Document accessible routes, lift locations, ramp gradients, hearing augmentation, and an emergency evacuation plan for mobility-impaired users. Submit this as part of the schematic design package.', category: 'Accessibility' });
  }
  if (scores.sustainability < 55) {
    recs.push({ priority: 'Critical', title: 'Develop a verified ESD strategy', explanation: 'Nominate a rating target (Green Star, NABERS, or equivalent). Map passive design principles to the scheme — orientation, thermal mass, natural ventilation, and solar shading. Confirm PV system sizing, rainwater reuse, and embodied carbon targets before schematic design proceeds.', category: 'Sustainability' });
  }
  if (scores.briefAlignment < 60) {
    recs.push({ priority: 'Important', title: 'Strengthen brief-to-concept traceability', explanation: 'Revise the concept statement to explicitly cross-reference each brief requirement. Use subheadings that mirror the brief structure. Demonstrate that each functional and performance requirement has been considered in the design response.', category: 'Design Brief' });
  }
  if (!hasContent(data.siteContext, 30)) {
    recs.push({ priority: 'Important', title: 'Document site analysis findings', explanation: 'Prepare a site analysis diagram or report addressing solar orientation, prevailing winds, view corridors, neighbouring context, pedestrian and vehicle access, and any site constraints (flood, contamination, easements). This should directly inform design decisions.', category: 'Site Response' });
  }
  if (scores.stakeholders < 55) {
    recs.push({ priority: 'Important', title: 'Map stakeholder requirements to spatial design', explanation: 'List each identified stakeholder group and their specific functional and spatial requirements. Cross-reference these against the proposed spatial program. Note where requirements are met, partially met, or not yet addressed.', category: 'Stakeholders' });
  }
  if (scores.heritage < 55 && hasContent(data.heritageContext, 5)) {
    recs.push({ priority: 'Advisory', title: 'Prepare a heritage impact statement', explanation: 'Where a heritage overlay applies, document the heritage significance of the site and its precinct. Demonstrate how the design response respects or enhances that significance. Note any triggers for Heritage Council referral.', category: 'Heritage' });
  }
  recs.push({ priority: 'Advisory', title: 'Review the design against the planning scheme', explanation: 'Before progressing to schematic design, check the proposal against relevant zoning, overlays, and design guidelines. Identify any permits required and confirm that the concept is broadly consistent with planning requirements to avoid late-stage redesign.', category: 'Feasibility' });

  return recs;
}

function buildOverallAssessment(scores, data) {
  const overall = scores.overall;
  let verdict, colour, summary;

  if (overall >= 80) {
    verdict = 'Compliant';
    colour = 'green';
    summary = `The ${data.projectType || 'design'} proposal demonstrates strong engagement with the brief and supporting strategies. The concept is well-articulated and the design approach is site-responsive. Minor refinements are recommended before schematic design.`;
  } else if (overall >= 60) {
    verdict = 'Partially Compliant';
    colour = 'amber';
    summary = `The ${data.projectType || 'design'} proposal shows adequate engagement with the brief but has identifiable gaps that must be addressed. The concept requires further development in the areas identified above before it can be considered compliant.`;
  } else if (overall >= 40) {
    verdict = 'Requires Significant Development';
    colour = 'amber';
    summary = `The ${data.projectType || 'design'} proposal requires significant further development. Critical requirements are not addressed and the concept does not yet demonstrate sufficient response to the brief. A revised submission should be prepared addressing the missing requirements and recommendations above.`;
  } else {
    verdict = 'Non-Compliant';
    colour = 'red';
    summary = `The current submission does not meet the minimum requirements for a concept design review. Fundamental information — including a substantive concept statement, site analysis, and specialist strategies — must be provided before a meaningful assessment can be made.`;
  }

  return { verdict, colour, summary, score: overall };
}

// ─── Master analysis function ─────────────────────────────────────────────

function analyseLocally(formData) {
  const {
    projectName, projectType, projectStage, reviewFocus,
    brief, concept, siteContext, stakeholders,
    sustainStrategy, accessStrategy, heritageContext,
  } = formData;

  // Calculate category scores
  const scores = {
    briefAlignment: scoreBriefAlignment(brief, concept),
    stakeholders: scoreStakeholders(stakeholders, concept),
    site: scoreSite(siteContext, concept),
    accessibility: scoreAccessibility(accessStrategy, concept),
    sustainability: scoreSustainability(sustainStrategy, concept),
    heritage: scoreHeritage(heritageContext, concept),
  };

  // Weighted overall: brief + site weighted 1.5×, others 1×
  const weightedSum =
    scores.briefAlignment * 1.5 +
    scores.site * 1.5 +
    scores.stakeholders +
    scores.accessibility +
    scores.sustainability +
    scores.heritage;
  const totalWeight = 1.5 + 1.5 + 1 + 1 + 1 + 1;
  scores.overall = clamp(Math.round(weightedSum / totalWeight));

  // Build structured findings
  const briefAlignment = buildBriefAlignment(brief, concept, projectType);
  const strengths = buildStrengths(formData, scores);
  const weaknesses = buildWeaknesses(formData, scores);
  const missingRequirements = buildMissingRequirements(formData);
  const risks = buildRisks(formData, scores);
  const recommendations = buildRecommendations(formData, scores);
  const overallAssessment = buildOverallAssessment(scores, formData);

  return {
    meta: {
      projectName: projectName || 'Untitled Project',
      projectType: projectType || '—',
      projectStage: projectStage || '—',
      reviewFocus: reviewFocus || 'All Categories',
      reviewDate: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
      generatedBy: 'AI Design Brief Checker (Rule-based analysis)',
    },
    scores,
    briefAlignment,
    strengths,
    weaknesses,
    missingRequirements,
    stakeholders: hasContent(stakeholders, 10)
      ? [{ name: 'Identified stakeholders', requirement: stakeholders.substring(0, 120) + (stakeholders.length > 120 ? '…' : ''), response: scores.stakeholders >= 60 ? 'Design appears to acknowledge stakeholder context.' : 'Explicit response to stakeholder requirements is not demonstrated in the concept.', verdict: scores.stakeholders >= 65 ? 'Met' : scores.stakeholders >= 45 ? 'Partially Met' : 'Not Met' }]
      : [{ name: 'Stakeholders not identified', requirement: 'Not provided', response: 'No stakeholder information was submitted.', verdict: 'Not Met' }],
    siteResponse: {
      score: scores.site,
      findings: hasContent(siteContext, 15)
        ? `Site context has been provided. ${scores.site >= 65 ? 'The analysis demonstrates awareness of key site conditions.' : 'The site analysis requires further development to demonstrate how site conditions directly inform the design.'}`
        : 'No site context was provided. Site analysis is a fundamental requirement for a responsive design.',
      observations: scores.site >= 60
        ? ['Site orientation and solar access referenced.', 'Contextual relationships with neighbouring built form considered.', 'Pedestrian and vehicle access considered.']
        : ['Insufficient site analysis to assess solar and wind response.', 'Contextual relationships are not demonstrated.', 'Pedestrian access and public realm are not addressed.'],
    },
    accessibilityReview: {
      score: scores.accessibility,
      findings: hasContent(accessStrategy, 15)
        ? `An accessibility strategy has been submitted. ${scores.accessibility >= 60 ? 'The approach demonstrates awareness of universal design principles.' : 'The strategy requires further development to demonstrate AS 1428 compliance.'}`
        : 'No accessibility strategy was submitted. This is a mandatory component of any building or public realm design.',
      observations: scores.accessibility >= 55
        ? ['Accessible routes appear to be considered.', 'Vertical access provision referenced.', 'Further detail required at schematic design stage.']
        : ['No documentation of accessible entry routes.', 'Lift or ramp provision not confirmed.', 'Hearing augmentation and sensory considerations absent.', 'Emergency evacuation for mobility-impaired users not addressed.'],
    },
    sustainabilityReview: {
      score: scores.sustainability,
      findings: hasContent(sustainStrategy, 15)
        ? `A sustainability strategy has been submitted. ${scores.sustainability >= 60 ? 'The approach references relevant passive design principles.' : 'The strategy lacks specific targets and technical substantiation.'}`
        : 'No sustainability strategy was submitted. A documented ESD approach is required to assess environmental performance.',
      observations: scores.sustainability >= 55
        ? ['Passive solar design principles referenced.', 'Renewable energy provision noted.', 'Water management strategy indicated.']
        : ['No passive solar design rationale provided.', 'No ESD rating target nominated.', 'Energy and water systems not addressed.', 'Embodied carbon not considered.'],
    },
    heritageReview: {
      score: scores.heritage,
      findings: hasContent(heritageContext, 10)
        ? `Heritage and cultural context has been noted. ${scores.heritage >= 65 ? 'The design demonstrates sensitivity to the heritage context.' : 'A more substantive heritage response is required.'}`
        : 'No heritage or cultural context was provided. If a heritage overlay applies, a documented response is required.',
      observations: scores.heritage >= 60
        ? ['Precinct character and materiality acknowledged.', 'Scale and massing appear contextually considered.']
        : ['Heritage significance of the site has not been assessed.', 'No documentation of cultural or indigenous heritage considerations.'],
    },
    risks,
    recommendations,
    overallAssessment,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI INTEGRATION POINT
//  ─────────────────────────────────────────────────────────────────────────
//  Replace analyseLocally() with this function to use the Claude API.
//  Steps:
//    1. Uncomment the function below.
//    2. Set your REACT_APP_ANTHROPIC_API_KEY in a .env file.
//    3. In generateReview(), replace: return analyseLocally(formData)
//       with:                          return await generateReviewWithClaude(formData)
//    4. Make sure generateReview() is async.
//
//  Note: In production, API calls should go through a backend server,
//  not the browser, to protect your API key.
// ─────────────────────────────────────────────────────────────────────────────

/*
async function generateReviewWithClaude(formData) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

  const systemPrompt = `You are a senior design reviewer with expertise in architecture, urban design,
interior design, landscape architecture, sustainability, accessibility, and heritage-sensitive design.
Your reviews are objective, evidence-based, and critical. You do not automatically praise designs.
You identify strengths, weaknesses, missing requirements, design risks, and opportunities for improvement.
Respond ONLY with a valid JSON object matching the ReviewReport schema. No preamble. No markdown fences.`;

  const userPrompt = `Review this design submission and return a structured JSON report.

Project: ${formData.projectName} (${formData.projectType}, ${formData.projectStage})
Review Focus: ${formData.reviewFocus}

DESIGN BRIEF:
${formData.brief}

CONCEPT STATEMENT:
${formData.concept}

SITE CONTEXT:
${formData.siteContext || 'Not provided'}

STAKEHOLDERS:
${formData.stakeholders || 'Not provided'}

SUSTAINABILITY STRATEGY:
${formData.sustainStrategy || 'Not provided'}

ACCESSIBILITY STRATEGY:
${formData.accessStrategy || 'Not provided'}

HERITAGE / CULTURAL CONSIDERATIONS:
${formData.heritageContext || 'Not provided'}

Return a JSON object with these keys:
scores: { overall, briefAlignment, stakeholders, site, accessibility, sustainability, heritage }
briefAlignment: { fully: string[], partially: {item, concern}[], missing: string[] }
strengths: string[]
weaknesses: string[]
missingRequirements: string[]
stakeholders: { name, requirement, response, verdict }[]
siteResponse: { score, findings, observations: string[] }
accessibilityReview: { score, findings, observations: string[] }
sustainabilityReview: { score, findings, observations: string[] }
heritageReview: { score, findings, observations: string[] }
risks: { risk, description, likelihood, impact }[]
recommendations: { priority, title, explanation, category }[]
overallAssessment: { verdict, colour, summary, score }`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  return {
    meta: {
      projectName: formData.projectName || 'Untitled Project',
      projectType: formData.projectType,
      projectStage: formData.projectStage,
      reviewFocus: formData.reviewFocus,
      reviewDate: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
      generatedBy: 'AI Design Brief Checker (Claude API)',
    },
    ...parsed,
  };
}
*/

// ─── Public export ────────────────────────────────────────────────────────

/**
 * Main entry point. Called by the React app on form submit.
 * Swap analyseLocally() for generateReviewWithClaude() to go live with Claude.
 */
export function generateReview(formData) {
  return analyseLocally(formData);
}

export { scoreToRating };
