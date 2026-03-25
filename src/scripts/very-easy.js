import axios from 'axios';

// Securely fetch the API key from an environment variable or backend
// const API_KEY = import.meta.env.PUBLIC_API_KEY;
// console.log(API_KEY);

const options = {
    method: 'GET',
    url: 'https://sudoku-all-purpose-pro.p.rapidapi.com/sudoku',
    headers: {
        'x-rapidapi-key': '367cc336fbmshd111f2775895059p1055e0jsn04b7fb5a3453',
        'x-rapidapi-host': 'sudoku-all-purpose-pro.p.rapidapi.com'
    }
};

async function fetchSudoku() {
    try {
        // Request to create a Sudoku puzzle
        const options1 = { ...options, params: { create: '46', output: 'SVG' } };
        const response1 = await axios.request(options1);
        const data1 = response1.data;

        if (!data1.output || !data1.output.base64_data) {
            throw new Error('Invalid API response: Missing base64_data');
        }

        const base64Svg = data1.output.base64_data;
        const raw = data1.output.raw_data;

        // Decode Base64 SVG
        const decodedSvg = atob(base64Svg);

        // Generatoe a unique filename 
        const fileName = getUniqueFileName();

        // Convert the SVG string into a Blob
        const blob = new Blob([decodedSvg], { type: 'image/svg+xml' });

        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;

        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`SVG file has been saved as "${fileName}".`);
       
        // Solve the Sudoku puzzle
        const options2 = { ...options, params: { solve: raw, output: 'SVG' } };
        const response2 = await axios.request(options2);
        const data2 = response2.data;

        if (!data2.output || !data2.output.raw_data) {
            throw new Error('Invalid API response: Missing raw_data');
        }

        const base64Svg2 = data2.output.base64_data;  
        const raw2 = data2.output.raw_data;
        console.log('Solved Sudoku:', data2);
      
        // Decode Base64 SVG
        const decodedSvg2 = atob(base64Svg2);

        // Generatoe a unique filename 
        const solutionFileName = getUniqueFileName2();

        // Convert the SVG string into a Blob
        const blob2 = new Blob([decodedSvg2], { type: 'image/svg+xml' });

        // Create a download link
        const solutionLink = document.createElement('a');
        solutionLink.href = URL.createObjectURL(blob2);
        solutionLink.download = solutionFileName;

        // Trigger the download
        document.body.appendChild(solutionLink);
        solutionLink.click();
        document.body.removeChild(solutionLink);

        console.log(`SVG file has been saved as "${solutionFileName}".`);
        
        // Verify the solution
        const options3 = { ...options, params: { verify: raw2 } };
        const response3 = await axios.request(options3);
        const data3 = response3.data;
        console.log('Verification Result:', data3);    
        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function getUniqueFileName() {
    let count = localStorage.getItem('sudokuCount') || 0;
    count = parseInt(count) + 1;
    localStorage.setItem('sudokuCount', count);
    return `sudoku${count}.svg`;
}

function getUniqueFileName2() {
    let count2 = localStorage.getItem('sudokuSolutionCount') || 0;
    count2 = parseInt(count2) + 1;
    localStorage.setItem('sudokuSolutionCount', count2);
    return `solution${count2}.svg`;
}

async function executeWithInterval(n) {
    let count = 0;
    const intervalId = setInterval(async () => {
        await fetchSudoku();
        count++;
        if (count >= n) {
            clearInterval(intervalId);
            console.log("Function execution completed.");
        }
    }, 3 * 60 * 1000); // 3 minutes in milliseconds
}

// Execute the function n times
executeWithInterval(20);
