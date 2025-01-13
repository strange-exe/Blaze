// Define the levels and required messages to reach them
const LEVELS = {
    1: { roleName: 'Support Enthusiast' },
    5: { roleName: 'Community Builder' },
    10: { roleName: 'Problem Solver' },
    15: { roleName: 'Insightful Helper' },
    20: { roleName: 'Knowledge Seeker' },
    25: { roleName: 'Expert Advisor' },
    30: { roleName: 'Tech Guru' },
    40: { roleName: 'Mentor' },
    50: { roleName: 'Legendary Supporter' },
    75: { roleName: 'Elite Visionary' },
    100: { roleName: 'Mastermind' },
};

const COLORS = {
    background: {
        start: '#8e44ad',
        end: '#2980b9'
    },
    border: '#f39c12',
    text: {
        primary: '#ecf0f1',
        secondary: '#f1c40f',
        tertiary: '#bdc3c7'
    }
};

const CANVAS_DIMENSIONS = {
    width: 1200,
    height: 650,
    avatar: {
        size: 220,
        x: 40,
        y: 100
    }
};

module.exports = {
    LEVELS,
    COLORS,
    CANVAS_DIMENSIONS
};
