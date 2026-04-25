// /public/js/admin.js

const token = localStorage.getItem('token');
let mainChart;

// 1. Tab Switching & Data Loader
function showTab(tabId, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.add('active');
        if (element) element.classList.add('active');
    }
    
    // Auto-load data based on section
    if (tabId === 'dashboard') { loadStats(); initChart(); }
    if (tabId === 'members') loadMembers();
    if (tabId === 'offers') loadOfferList(); // Offer list load hobe
    if (tabId === 'performance') loadPerformance();
    if (tabId === 'settings') loadSettings();
}

// 2. Dashboard Stats with Advanced Filtering
async function loadStats(range = 'today') {
    try {
        const res = await fetch(`/api/admin/stats?range=${range}`, { 
            headers: {'x-auth-token': token}
        });
        const data = await res.json();
        
        document.getElementById('s-users').innerText = data.totalUsers || 0;
        document.getElementById('s-offers').innerText = data.totalOffers || 0;
        document.getElementById('s-balance').innerText = `$${(data.totalRevenue || 0).toFixed(2)}`;
        document.getElementById('s-approved').innerText = `$${(data.approvedBalance || 0).toFixed(2)}`;
        document.getElementById('s-leads').innerText = data.pendingLeads || 0;
        
        if(data.chartData) updateChart(data.chartData); 
    } catch (err) {
        console.error("Stats loading failed");
    }
}

function filterData(range) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if(event) event.target.classList.add('active');
    loadStats(range);
}

// 3. Offer Management (Manual & API logic)
async function saveOffer() {
    const offerData = {
        offerName: document.getElementById('off-name').value,
        payout: document.getElementById('off-pay').value,
        offerLink: document.getElementById('off-link').value,
        memberPercent: document.getElementById('off-percent').value || 60,
        offerType: document.getElementById('off-type').value, // manual or api
        targetCountry: document.getElementById('off-country').value || 'ALL'
    };
    
    const res = await fetch('/api/offers', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: JSON.stringify(offerData)
    });

    if(res.ok) {
        alert("Offer Saved Successfully!");
        showTab('offers');
    } else {
        alert("Error saving offer");
    }
}

// 4. Domain Manager Logic
async function updateDomain() {
    const newDomain = document.getElementById('new-domain-url').value;
    if(!newDomain) return alert("Enter Domain URL");

    const res = await fetch('/api/admin/update-domain', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: JSON.stringify({ domain: newDomain })
    });

    if(res.ok) alert("Tracking Domain Updated!");
}

// 5. System Settings & Postback URL Display
function loadSettings() {
    // Apnar domain onujayi postback link auto generate hobe
    const currentDomain = window.location.origin;
    const pbUrl = `${currentDomain}/api/postback?click_id={click_id}&payout={payout}`;
    document.getElementById('postback-display').value = pbUrl;
}

// 6. Chart.js Initialization
function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (mainChart) mainChart.destroy();
    
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue ($)',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateChart(chartData) {
    if(!mainChart) return;
    mainChart.data.labels = chartData.labels;
    mainChart.data.datasets[0].data = chartData.values;
    mainChart.update();
}

// Logout logic
function logout() {
    localStorage.removeItem('token');
    window.location.replace('/index.html');
}

window.onload = () => {
    if(!token) window.location.replace('/index.html');
    showTab('dashboard');
};