import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

// Import images
import backgroundImage from '../assets/images/background.png';
import racingLines from '../assets/images/racing-lines.png';
import brakeAnalysis from '../assets/images/brake-analysis.png';
import racingCar from '../assets/images/racing-car.png';


function HomePage() {
  return (
    <div className="homepage" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Hero Section */}
      <section className="hero-section" style={{
        textAlign: 'center',
        padding: '100px 20px',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '4rem',
            marginBottom: '30px',
            background: 'linear-gradient(45deg, #00d4ff, #ff6b6b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold'
          }}>
            Welcome to AssettoTC
          </h1>
          <p style={{
            fontSize: '2.0rem',
            marginBottom: '50px',
            opacity: '0.9',
            lineHeight: '4.7',
            maxWidth: '1200px',
            margin: '0 auto 50px auto'
          }}>
            The most effortless way to unlock the secrets of racing aliens.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" style={{
        padding: '100px 20px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(15px)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '3rem',
            marginBottom: '80px',
            color: '#00d4ff',
            fontWeight: 'bold'
          }}>
            Master Your Racing Performance
          </h2>
          
          {/* First Row - 2 Large Features */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '50px',
            marginBottom: '60px'
          }}>
            {/* Feature 1 */}
            <div className="feature-card" style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <img src={racingLines} alt="Racing Lines" style={{
                width: '100%',
                maxWidth: '400px',
                height: '200px',
                marginBottom: '25px',
                borderRadius: '15px',
                objectFit: 'cover',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }} />
              <h3 style={{
                fontSize: '1.8rem',
                marginBottom: '20px',
                color: '#ff6b6b',
                fontWeight: 'bold'
              }}>
                Perfect Your Racing Lines
              </h3>
              <p style={{
                opacity: '0.9',
                lineHeight: '1.6',
                fontSize: '1.1rem'
              }}>
                Visualize and analyze your racing lines compared to professional drivers. 
                Find the optimal path through every corner and shave seconds off your lap times.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card" style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <img src={brakeAnalysis} alt="Brake Analysis" style={{
                width: '100%',
                maxWidth: '400px',
                height: '200px',
                marginBottom: '25px',
                borderRadius: '15px',
                objectFit: 'cover',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }} />
              <h3 style={{
                fontSize: '1.8rem',
                marginBottom: '20px',
                color: '#ffc107',
                fontWeight: 'bold'
              }}>
                Master Your Braking Points
              </h3>
              <p style={{
                opacity: '0.9',
                lineHeight: '1.6',
                fontSize: '1.1rem'
              }}>
                Discover the exact braking points used by the fastest drivers. 
                Learn when to brake, how hard to brake, and when to trail off to get back on the gas.
              </p>
            </div>
          </div>

          {/* Third Row - Full Width Racing Car Feature */}
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div className="feature-card" style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '50px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              maxWidth: '800px',
              width: '100%'
            }}>
              <img src={racingCar} alt="Racing Performance" style={{
                width: '100%',
                maxWidth: '600px',
                height: '300px',
                marginBottom: '30px',
                borderRadius: '15px',
                objectFit: 'cover',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
              }} />
              <h3 style={{
                fontSize: '2rem',
                marginBottom: '20px',
                color: '#fd7e14',
                fontWeight: 'bold'
              }}>
                The easiest way to take your sim racing to the next level
              </h3>
              <p style={{
                opacity: '0.9',
                lineHeight: '1.6',
                fontSize: '1.2rem',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                No downloads. No installations. <br/>
                just upload the vanilla replay files and start analyzing immediatley.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section" style={{
        padding: '100px 20px',
        textAlign: 'center',
        background: 'linear-gradient(45deg, rgba(0, 212, 255, 0.15), rgba(255, 107, 107, 0.15))',
        backdropFilter: 'blur(2px)'
      }}>
        <div style={{
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            marginBottom: '25px',
            color: '#00d4ff',
            fontWeight: 'bold'
          }}>
            Ready to Dominate the Track?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '50px',
            opacity: '0.9',
            lineHeight: '1.7'
          }}>
            Join the AssettoTC community and start analyzing your telemetry data today.
          </p>
          <div style={{
            display: 'flex',
            gap: '40px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link to="/analyze" style={{
            background: 'linear-gradient(45deg, #007bff, #0056b3)',
            color: 'white',
            padding: '20px 50px',
            borderRadius: '15px',
            textDecoration: 'none',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer',
            transform: 'translateY(0)',
            ':hover': {
            transform: 'translateY(-2px)'
            }
            }}>
            Analyze Your Telemetry
            </Link>
            <Link to="/generate" style={{
            background: 'linear-gradient(45deg, #28a745, #1e7e34)',
            color: 'white',
            padding: '20px 50px',
            borderRadius: '15px',
            textDecoration: 'none',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer',
            transform: 'translateY(0)',
            ':hover': {
            transform: 'translateY(-2px)'
            }
            }}>
            Parse Replay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;