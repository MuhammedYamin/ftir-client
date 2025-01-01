import React, { useState } from "react";
import "./App.css"; // Import the CSS file

const FTIRPeakDetection = () => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]); // Changed to an array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedMinima, setDetectedMinima] = useState([]); // Changed to an array
  const [imageUrl, setImageUrl] = useState(null); // State to store the image URL
  const [showResults, setShowResults] = useState(false); // State to control visibility of results

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setResults([]); // Reset previous results
    setError(null); // Reset any errors
    setDetectedMinima([]); // Reset minima results
    setImageUrl(null);
    setShowResults(false); // Hide results initially
  };

  // Handle file upload and peak detection
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent form default behavior

    if (!file) {
      setResults([]);
      setError("No file selected.");
      return;
    }

    if (file.type !== "text/csv") {
      setResults([]);
      setError("Please upload a valid CSV file.");
      return;
    }

    setLoading(true); // Set loading state to true
    setResults([]); // Clear previous results
    setError(null); // Clear any previous errors
    setDetectedMinima([]); // Clear previous minima results
    setImageUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload_ftir/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setLoading(false); // Set loading state to false after response

      if (data.detected_maxima) {
        setResults(data.detected_maxima); // Save raw data
      } else {
        setError(data.error || "An unknown error occurred.");
      }

      // Fetch the spectrum image using the filename returned from the backend
      const imageResponse = await fetch(`http://127.0.0.1:8000/get_spectrum_image/${data.image_filename}`);
      if (imageResponse.ok) {
        const imageUrl = await imageResponse.blob();
        setImageUrl(URL.createObjectURL(imageUrl)); // Create an object URL for the image
      } else {
        setError("Failed to fetch the spectrum image.");
      }

      // Show results after data is fetched
      setShowResults(true);
    } catch (error) {
      setLoading(false);
      setError(`Error: ${error.message}`);
    }
  };

  // Format the detected peaks for better readability
  const formatResults = (peaks) => {
    return peaks.length > 0
      ? peaks.map((peak, index) => (
          <div key={index} className="result-item">
            <strong>{index + 1}. Peak {index + 1}:</strong>
            <br />
            <p>Wavenumber: {peak.wavenumber}</p>
            <p>Absorbance: {peak.absorbance}</p>
            <p>Type: {peak.type}</p>
          </div>
        ))
      : "No peaks detected.";
  };

  // Format the detected minima for better readability
  const formatMinima = (minima) => {
    return minima.length > 0
      ? minima.map((minima, index) => (
          <div key={index} className="result-item">
            <strong>{index + 1}. Minima {index + 1}:</strong>
            <br />
            <p>Wavenumber: {minima.wavenumber || "N/A"}</p>
            <p>Absorbance: {minima.absorbance || "N/A"}</p>
            <p>Type: {minima.type || "N/A"}</p>
          </div>
        ))
      : "No minima detected.";
  };

  return (
    <div className="container">
      <h1>FTIR Charecteristic Analysis</h1>

      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="file">Choose CSV File:</label>
        <input
          type="file"
          id="file"
          accept=".csv"
          onChange={handleFileChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Upload File"}
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <div className="results-container">
        {/* Left Side Content: Detected Peaks and Minima */}
        <div className="left-content">
          {showResults && (
           <>
           <div className="results-section">
             <h3 className="fixed-heading">Detected Peaks</h3>
             <div className="scrollable">{formatResults(results)}</div>
           </div>
         
           <div className="results-section">
             <h3 className="fixed-heading">Detected Minima</h3>
             <div className="scrollable">{formatMinima(detectedMinima)}</div>
           </div>
         </>
         
          )}
        </div>

        {/* Right Side Content: Image */}
        <div className="right-content">
          {imageUrl && (
            <div className="image-container">
              <h3>Spectrum with Functional Groups</h3>
              <img src={imageUrl} alt="FTIR Spectrum" className="spectrum-image" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FTIRPeakDetection;
