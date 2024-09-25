const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Path to your service account JSON key file
const SERVICE_ACCOUNT_KEY_PATH = './service-account-key.json';
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH));

// Google Analytics Data API setup
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

const analyticsData = google.analyticsdata({
  version: 'v1beta',
  auth: auth,
});

const app = express();
const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Fetch Google Analytics data for GA4 (both main and comparison date ranges)
app.get('/analytics', async (req, res) => {
  const startDate = req.query.startDate || '90daysAgo';
  const endDate = req.query.endDate || 'today';
  const matchType = req.query.matchType || ''; // Match type: "exact" or "contains"
  const keyword = req.query.keyword || ''; // Keyword for filtering page paths

  try {
    const requestBody = {
      dateRanges: [
        {
          startDate: startDate,
          endDate: endDate,
        },
      ],
      dimensions: [
        { name: 'browser' },
        { name: 'deviceCategory' },
        { name: 'country' },
        { name: 'city' },
        { name: 'pagePath' }  // Add pagePath dimension to show the data for a particular page
      ],
      metrics: [
        { name: 'activeUsers' },              // Active Users
        { name: 'sessions' },                 // Sessions
        { name: 'bounceRate' },               // Bounce Rate
        { name: 'newUsers' },                 // New Users
        { name: 'averageSessionDuration' },   // Average Session Duration
        { name: 'eventCount' },               // Event Count
        { name: 'engagementRate' },           // Engagement Rate per user (i.e., Average Engagement Time)
        { name: 'screenPageViews' },          // Correct metric for Views (screen views + page views)
        { name: 'sessionsPerUser' },          // Views per Active User (Correct metric in GA4)
        { name: 'totalRevenue' },             // Total Revenue
      ],
    };

    // Add a filter for the page path if provided
    if (keyword) {
      requestBody.dimensionFilter = {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            value: keyword,
            matchType: matchType === 'exact' ? 'EXACT' : 'CONTAINS', // Match exactly or contains
          },
        },
      };
    }

    const response = await analyticsData.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      requestBody: requestBody,
    });

    if (response.data && response.data.rows) {
      res.json(response.data);
    } else {
      res.json({ message: 'No data available for the selected dimensions and metrics.' });
    }
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    res.status(500).send('Error fetching Google Analytics data');
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
