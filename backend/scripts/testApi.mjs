import axios from 'axios';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3R1c2VyKzFAZXhhbXBsZS5jb20iLCJ1c2VySWQiOiIxIiwiaWF0IjoxNzgwMjc1OTczfQ.cNELED01YfFcKFJGIHpkgATc-HM2WRNn4dy8hmytbac';

try {
  const response = await axios.get('http://localhost:5003/api/homevisits/my-visits', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log(JSON.stringify(response.data, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}
