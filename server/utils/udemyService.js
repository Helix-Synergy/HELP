const axios = require('axios');

/**
 * Udemy Business API Service
 * Reference: https://business-support.udemy.com/hc/en-us/articles/115005391267-Udemy-Business-API-Reference-Guide
 */

const getUdemyCourses = async () => {
    const accountName = process.env.UDEMY_ACCOUNT_NAME;
    const clientId = process.env.UDEMY_CLIENT_ID;
    const clientSecret = process.env.UDEMY_CLIENT_SECRET;

    if (!accountName || !clientId || !clientSecret) {
        console.warn('Udemy API credentials not configured. Returning empty course list.');
        return [];
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const baseUrl = `https://${accountName}.udemy.com/api-2.0/organizations/courses/`;

    try {
        const response = await axios.get(baseUrl, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            params: {
                page_size: 100 // Fetch up to 100 courses
            }
        });

        // Map Udemy response to our Course model structure
        return response.data.results.map(course => ({
            externalId: course.id.toString(),
            title: course.title,
            description: course.description || course.headline,
            category: 'TECHNICAL', // Default category
            durationMinutes: 60, // Placeholder
            courseUrl: course.url,
            thumbnailUrl: course.images?.['480x270'],
            externalProvider: 'UDEMY'
        }));
    } catch (error) {
        console.error('Error fetching Udemy courses:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = {
    getUdemyCourses
};
