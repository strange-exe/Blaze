const CANVAS_CONFIG = {
    dimensions: {
        width: 1200,
        height: 400  // Reduced height for a more modern look
    },
    avatar: {
        size: 180,
        x: 50,
        y: 110,
        borderWidth: 8,
        borderRadius: 90,
        shadowBlur: 15,
        shadowColor: 'rgba(0,0,0,0.3)'
    },
    progressBar: {
        x: 280,
        y: 280,
        width: 850,
        height: 30,
        radius: 15,
        shadowBlur: 10
    },
    fonts: {
        title: 'bold 32px "Arial"',
        username: 'bold 40px "Arial"',
        stats: 'bold 28px "Arial"',
        level: 'bold 65px "Arial"',
        footer: '24px "Arial"'
    },
    layout: {
        padding: 40,
        spacing: 25
    }
};

module.exports = CANVAS_CONFIG;