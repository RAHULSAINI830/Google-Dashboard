document.addEventListener('DOMContentLoaded', async () => {
    // On initial load, fetch data for all pages (no filter)
    await fetchAnalyticsData();
});

document.getElementById('fetchData').addEventListener('click', async () => {
    await fetchAnalyticsData();
});

// Function to fetch analytics data with optional page path filter
async function fetchAnalyticsData() {
    const startDate1 = document.getElementById('startDate1').value || '90daysAgo';
    const endDate1 = document.getElementById('endDate1').value || 'today';
    
    const startDate2 = document.getElementById('startDate2').value || '90daysAgo';
    const endDate2 = document.getElementById('endDate2').value || 'today';

    // Get filter options (match type and keyword)
    const matchType = document.getElementById('matchType').value;
    const keyword = document.getElementById('keyword').value.trim();
    
    const tableBody = document.querySelector('#analyticsTable tbody');
    const errorDiv = document.getElementById('error');
    const ctx = document.getElementById('analyticsChart').getContext('2d');

    tableBody.innerHTML = '';
    errorDiv.textContent = '';

    try {
        // Build query parameters based on filter
        let pagePathFilter = '';
        if (keyword) {
            const encodedKeyword = encodeURIComponent(keyword);
            pagePathFilter = `&matchType=${matchType}&keyword=${encodedKeyword}`;
        }

        // Fetch data for the first date range
        const response1 = await fetch(`/analytics?startDate=${startDate1}&endDate=${endDate1}${pagePathFilter}`);
        const data1 = await response1.json();

        // Fetch data for the comparison date range
        const response2 = await fetch(`/analytics?startDate=${startDate2}&endDate=${endDate2}${pagePathFilter}`);
        const data2 = await response2.json();

        if (data1.rows && data1.rows.length > 0 && data2.rows && data2.rows.length > 0) {
            const labels = [];
            const sessionsData1 = [];
            const sessionsData2 = [];

            // Prepare comparison data for the table and chart
            for (let i = 0; i < data1.rows.length; i++) {
                const browser = data1.rows[i].dimensionValues[0].value || 'Unknown';
                const deviceCategory = data1.rows[i].dimensionValues[1].value || 'Unknown';
                const pagePath = data1.rows[i].dimensionValues[4].value || 'Unknown'; // Add the pagePath column
                const activeUsers1 = data1.rows[i].metricValues[0].value;  // Active Users for first range
                const sessions1 = data1.rows[i].metricValues[1].value;  // Sessions for first range
                const views1 = data1.rows[i].metricValues[7].value; // Views (screenPageViews)
                const viewsPerUser1 = data1.rows[i].metricValues[8].value; // Sessions per active user
                const engagementRate1 = data1.rows[i].metricValues[6].value; // Average engagement time
                const eventCount1 = data1.rows[i].metricValues[5].value; // Event Count
                const totalRevenue1 = data1.rows[i].metricValues[9].value; // Total Revenue

                const bounceRate1 = data1.rows[i].metricValues[2].value;  // Bounce Rate
                const newUsers1 = data1.rows[i].metricValues[3].value;  // New Users
                const avgSessionDuration1 = data1.rows[i].metricValues[4].value;  // Avg. Session Duration

                // Find matching row in the second dataset (comparison)
                const match = data2.rows.find(row =>
                    row.dimensionValues[0].value === browser &&
                    row.dimensionValues[1].value === deviceCategory &&
                    row.dimensionValues[4].value === pagePath  // Match on pagePath too
                );
                const sessions2 = match ? match.metricValues[1].value : '0';
                const views2 = match ? match.metricValues[7].value : '0';
                const viewsPerUser2 = match ? match.metricValues[8].value : '0';
                const engagementRate2 = match ? match.metricValues[6].value : '0';
                const eventCount2 = match ? match.metricValues[5].value : '0';
                const totalRevenue2 = match ? match.metricValues[9].value : '0';

                const bounceRate2 = match ? match.metricValues[2].value : '0';
                const newUsers2 = match ? match.metricValues[3].value : '0';
                const avgSessionDuration2 = match ? match.metricValues[4].value : '0';

                // Populate table
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${browser}</td>
                    <td>${deviceCategory}</td>
                    <td>${pagePath}</td>   <!-- Show which page path the data is for -->
                    <td>${activeUsers1}</td>
                    <td>${sessions1}</td>
                    <td>${sessions2}</td>
                    <td>${views1}</td>
                    <td>${viewsPerUser1}</td>
                    <td>${engagementRate1}</td>
                    <td>${eventCount1}</td>
                    <td>${totalRevenue1}</td>
                    <td>${views2}</td>
                    <td>${viewsPerUser2}</td>
                    <td>${engagementRate2}</td>
                    <td>${eventCount2}</td>
                    <td>${totalRevenue2}</td>
                    <td>${bounceRate1}</td>
                    <td>${bounceRate2}</td>
                    <td>${newUsers1}</td>
                    <td>${newUsers2}</td>
                    <td>${avgSessionDuration1}</td>
                    <td>${avgSessionDuration2}</td>
                `;
                tableBody.appendChild(tr);

                // Collect data for the chart
                labels.push(`${browser} (${deviceCategory}) - ${pagePath}`);
                sessionsData1.push(sessions1);
                sessionsData2.push(sessions2);
            }

            // Create a bar chart using Chart.js for comparison
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels, // Labels are browser + deviceCategory combinations + pagePath
                    datasets: [{
                        label: 'Sessions (First Date Range)',
                        data: sessionsData1, // Data for first date range
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Sessions (Comparison Date Range)',
                        data: sessionsData2, // Data for comparison date range
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            errorDiv.textContent = 'No data available for the selected dimensions and metrics.';
        }
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        errorDiv.textContent = 'Error fetching analytics data. Please try again later.';
    }
}
