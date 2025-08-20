export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://cewtdao.zone');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { collectionId } = req.body;
    
    // Validate collection ID
    if (!collectionId) {
      return res.status(400).json({ error: 'Collection ID is required' });
    }

    // Call your Superbolt GraphQL API to get sales data
    const response = await fetch('https://api.superbolt.wtf/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query SalesFeed($collectionId: String!) {
            auctions(
              where: { collection_id: { equals: $collectionId } }
              orderBy: { settle_date: desc }
              take: 50
            ) {
              settle_date
              settle_amount
              denom
              buyer {
                address_id
              }
              seller {
                address_id
              }
              nft {
                nft_id
                name
                image
              }
            }
          }
        `,
        variables: { collectionId }
      })
    });

    if (!response.ok) {
      throw new Error(`Superbolt API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
    }

    // Set CORS headers for successful response
    res.setHeader('Access-Control-Allow-Origin', 'https://cewtdao.zone');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.status(200).json({ data: data.data });
    
  } catch (error) {
    console.error('Sales feed API error:', error);
    
    // Set CORS headers for error response too
    res.setHeader('Access-Control-Allow-Origin', 'https://cewtdao.zone');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.status(500).json({ error: error.message });
  }
}
