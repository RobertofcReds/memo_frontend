import React from 'react';
import styles from '../pages/css/Admin.module.css';

// Composant de graphique en camembert simple
export const SimplePieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;

    return (
        <div className={styles["simple-chart"]}>
            <h4>{title}</h4>
            <div className={styles["pie-chart"]}>
                <svg viewBox="0 0 100 100">
                    {data.map((item, index) => {
                        const percentage = (item.value / total) * 100;
                        const angle = (percentage / 100) * 360;
                        const endAngle = startAngle + angle;

                        const startRad = (startAngle - 90) * (Math.PI / 180);
                        const endRad = (endAngle - 90) * (Math.PI / 180);

                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);

                        const largeArc = angle > 180 ? 1 : 0;

                        const path = `
                            M 50 50
                            L ${x1} ${y1}
                            A 40 40 0 ${largeArc} 1 ${x2} ${y2}
                            Z
                        `;

                        startAngle = endAngle;

                        return (
                            <path
                                key={index}
                                d={path}
                                fill={item.color}
                                stroke="#fff"
                                strokeWidth="1"
                            />
                        );
                    })}
                </svg>
                <div className={styles["chart-legend"]}>
                    {data.map((item, index) => (
                        <div key={index} className={styles["legend-item"]}>
                            <span
                                className={styles["legend-color"]}
                                style={{ backgroundColor: item.color }}
                            ></span>
                            <span className={styles["legend-label"]}>
                                {item.name}: {item.value} ({Math.round((item.value / total) * 100)}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Composant de graphique linéaire simple
export const SimpleLineChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.count));
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d.count / maxValue) * 100;
        return { x, y };
    });

    const pathData = points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    return (
        <div className={styles["simple-chart"]}>
            <h4>{title}</h4>
            <div className={styles["line-chart"]}>
                <svg viewBox="0 0 100 100">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((y, i) => (
                        <line
                            key={i}
                            x1="0"
                            y1={y}
                            x2="100"
                            y2={y}
                            stroke="#e9ecef"
                            strokeWidth="0.5"
                        />
                    ))}

                    {/* Data line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="#2a6f97"
                        strokeWidth="2"
                    />

                    {/* Data points */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="2"
                            fill="#2a6f97"
                            stroke="#fff"
                            strokeWidth="1"
                        />
                    ))}
                </svg>
                <div className={styles["x-axis"]}>
                    {data.map((d, i) => (
                        <div key={i} className={styles["x-tick"]}>
                            {d.day}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Composant de graphique en barres simple
export const SimpleBarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.visits));

    return (
        <div className={styles["simple-chart"]}>
            <h4>{title}</h4>
            <div className={styles["bar-chart"]}>
                <div className={styles["bars-container"]}>
                    {data.map((item, index) => (
                        <div key={index} className={styles["bar-item"]}>
                            <div className={styles["bar-label"]}>{item.region}</div>
                            <div className={styles["bar-wrapper"]}>
                                <div
                                    className={styles["bar"]}
                                    style={{
                                        width: `${(item.visits / maxValue) * 100}%`,
                                        backgroundColor: item.color
                                    }}
                                >
                                    <span className={styles["bar-value"]}>{item.visits}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Composant de carte de statistiques
export const StatCard = ({ icon, value, label, trend, type = 'primary' }) => (
    <div className={`${styles["stat-card"]} ${styles[type]}`}>
        <div className={styles["stat-icon"]}>
            <i className={icon}></i>
        </div>
        <div className={styles["stat-info"]}>
            <h3>{value}</h3>
            <p>{label}</p>
            {trend && (
                <span className={styles["stat-trend"]}>
                    {trend}
                </span>
            )}
        </div>
    </div>
);