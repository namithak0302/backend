// --- QUIZ DATA (12 questions) ---
const QUESTIONS = [
  {q:"Do you enjoy solving logical problems?", type:"technical"},
  {q:"Do you like drawing or designing things?", type:"creative"},
  {q:"Do you enjoy working with computers?", type:"technical"},
  {q:"Do you like helping/teaching others?", type:"social"},
  {q:"Do you prefer leading group projects?", type:"leadership"},
  {q:"Do you enjoy research and data?", type:"analytical"},
  {q:"Do you like building things with code?", type:"technical"},
  {q:"Do you enjoy storytelling or writing?", type:"creative"},
  {q:"Do you find comfort in rules and structure?", type:"analytical"},
  {q:"Do you like organizing events or teams?", type:"leadership"},
  {q:"Do you enjoy conversations and networking?", type:"social"},
  {q:"Do you enjoy working on security/privacy?", type:"technical"}
];

const TYPES = ["technical","creative","social","leadership","analytical"];

let answers = new Array(QUESTIONS.length).fill("no");
let idx = 0;

// DOM
const landing = document.getElementById("landing");
const startBtn = document.getElementById("startBtn");
const themeToggle = document.getElementById("themeToggle");
const quizSection = document.getElementById("quizSection");
const questionBox = document.getElementById("questionBox");
const qIndex = document.getElementById("qIndex");
const barFill = document.getElementById("barFill");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const loader = document.getElementById("loader");
const resultSection = document.getElementById("resultSection");
const resultTitle = document.getElementById("resultTitle");
const careerList = document.getElementById("careerList");
const roadmapEl = document.getElementById("roadmap");
let chart;

// start
startBtn.onclick = () => {
  landing.classList.add("hidden");
  quizSection.classList.remove("hidden");
  renderQuestion();
};

// theme toggle
themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
};

// render question
function renderQuestion(){
  const q = QUESTIONS[idx];
  qIndex.innerText = `Question ${idx+1} of ${QUESTIONS.length}`;
  const percent = Math.round(((idx+1)/QUESTIONS.length)*100);
  barFill.style.width = percent + "%";

  questionBox.innerHTML = `
    <p><strong>${q.q}</strong></p>
    <select id="sel">
      <option value="yes">Yes</option>
      <option value="no">No</option>
      <option value="maybe">Maybe</option>
    </select>
  `;
  document.getElementById("sel").value = answers[idx];
  document.getElementById("sel").onchange = e => answers[idx] = e.target.value;
  prevBtn.style.display = idx===0? "none":"inline-block";
  nextBtn.innerText = (idx===QUESTIONS.length-1) ? "Submit Quiz" : "Next";
}

// navigation
nextBtn.onclick = async () => {
  if(idx < QUESTIONS.length-1){
    idx++;
    renderQuestion();
  } else {
    // submit
    quizSection.classList.add("hidden");
    loader.classList.remove("hidden");
    // show loader for a moment (simulate processing)
    setTimeout(runAnalysis, 900);
  }
};
prevBtn.onclick = () => {
  if(idx>0){ idx--; renderQuestion(); }
};

// analysis - simple heuristic scoring
function runAnalysis(){
  // score counts
  const score = {technical:0,creative:0,social:0,leadership:0,analytical:0};
  QUESTIONS.forEach((q,i) => {
    const a = answers[i];
    if(a === "yes") score[q.type] += 2;
    else if(a === "maybe") score[q.type] += 1;
  });

  // determine top type
  const sorted = Object.entries(score).sort((a,b)=>b[1]-a[1]);
  const personality = sorted[0][0];

  // create suggested careers (simple mapping)
  const careerMap = {
    technical:["Software Developer","Cloud Engineer","Cybersecurity"],
    creative:["UI/UX Designer","Graphic Designer","Animator"],
    social:["Teacher","Counselor","HR Manager"],
    leadership:["Product Manager","Team Lead","Operations Manager"],
    analytical:["Data Analyst","Business Analyst","Research Scientist"]
  };

  const roadmapMap = {
    "technical":["Learn programming basics (Python/JS)","Build small projects","Learn Data Structures & Algorithms","Contribute to GitHub","Apply for internships"],
    "creative":["Learn design fundamentals","Practice UI tools (Figma)","Build portfolio","Take design projects","Join design communities"],
    "social":["Practice communication & teaching","Volunteer or tutor","Learn presentation skills","Build a portfolio of workshops","Apply for roles"],
    "leadership":["Learn project management basics","Take small team projects","Learn stakeholder communication","Build leadership portfolio","Apply for coordinator roles"],
    "analytical":["Learn Excel & SQL","Learn statistics and Python (pandas)","Work on datasets","Make dashboards","Apply for analyst internships"]
  };

  // prepare results UI
  loader.classList.add("hidden");
  resultSection.classList.remove("hidden");
  resultTitle.innerText = `Personality Type: ${capitalize(personality)}`;

  careerList.innerHTML = `<strong>Suggested Careers:</strong><ul>${careerMap[personality].map(c=>`<li>${c}</li>`).join("")}</ul>`;
  roadmapEl.innerHTML = roadmapMap[personality].map(s=>`<li>${s}</li>`).join("");

  // draw chart
  renderChart(score);

  // POST to backend to save
  saveResults({ personality, score, answers });
}

function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

// chart rendering
function renderChart(score){
  const ctx = document.getElementById('scoreChart').getContext('2d');
  const labels = Object.keys(score).map(capitalize);
  const data = Object.values(score);
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type:'bar',
    data:{labels, datasets:[{label:'Score', data}]},
    options:{scales:{y:{beginAtZero:true}}}
  });
}

// save to backend
async function saveResults(payload){
  try{
    await fetch('http://localhost:5000/analyze', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    // we don't need to show response here; backend also saves results.json
  } catch(e){
    console.error('Save failed',e);
  }
}