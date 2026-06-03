# 🍔 Online Food Delivery Data Analysis Using Python

## 📌 Project Overview

This is a complete beginner-friendly Python Data Science project for analyzing online food delivery data. The project is designed for college students studying Python for Data Science and includes comprehensive exploratory data analysis (EDA) with professional visualizations.

## 🎯 Project Objectives

- Analyze customer ordering behavior and preferences
- Evaluate restaurant performance and ratings
- Study delivery efficiency and patterns
- Examine revenue trends and order values
- Identify popular food items and cuisines
- Generate actionable business insights

## 📁 Project Structure

```
Online-Food-Delivery-Analysis/
│
├── dataset/
│   └── food_delivery.csv          # Dataset with 100 food delivery orders
│
├── Online_Food_Delivery_Analysis.ipynb  # Main Jupyter Notebook
├── generate_notebook.py           # Script to generate the notebook
└── README.md                      # Project documentation
```

## 📊 Dataset Information

The dataset contains **100 food delivery orders** with the following columns:

- **Order_ID**: Unique identifier for each order
- **Customer_Name**: Name of the customer
- **Restaurant_Name**: Name of the restaurant
- **Food_Item**: Food item ordered
- **Cuisine_Type**: Type of cuisine (Indian, Italian, Chinese, Fast Food)
- **Order_Date**: Date of the order
- **Order_Time**: Time of the order
- **Delivery_Time_Minutes**: Time taken for delivery (in minutes)
- **Distance_KM**: Delivery distance (in kilometers)
- **Order_Value**: Order amount (in ₹)
- **Payment_Method**: Payment method used (UPI, Credit Card, Debit Card, Cash)
- **Rating**: Customer rating (out of 5)
- **Delivery_Status**: Status of delivery

## 🛠️ Technologies Used

- **Python 3.x**
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical operations
- **Matplotlib** - Data visualization
- **Seaborn** - Statistical visualizations

## 📚 Project Sections

### SECTION 1: Project Title
- Introduction to online food delivery systems
- Project objectives

### SECTION 2: Import Libraries
- Import Pandas, NumPy, Matplotlib, Seaborn

### SECTION 3: Load Dataset
- Read CSV file
- Display dataset structure
- Show summary statistics

### SECTION 4: Data Cleaning
- Check for missing values
- Remove duplicates
- Handle null values
- Convert date/time columns

### SECTION 5: Exploratory Data Analysis (EDA)

#### A. Food Analysis
- Most ordered food items
- Top 10 food items
- Most popular cuisines

#### B. Restaurant Analysis
- Top restaurants by orders
- Highest-rated restaurants
- Restaurant revenue analysis

#### C. Revenue Analysis
- Total revenue
- Average order value
- Revenue by restaurant

#### D. Delivery Analysis
- Average delivery time
- Fastest and slowest deliveries
- Distance vs delivery time correlation

#### E. Customer Behavior Analysis
- Peak ordering hours
- Most used payment methods
- Ratings distribution
- Orders by day of week

#### F. Correlation Analysis
- Correlation matrix
- Heatmap visualization

### SECTION 6: Conclusion
- Summary of key findings
- Business recommendations
- Learning outcomes

## 📈 Visualizations Included

The project includes **12+ professional visualizations**:

1. Bar chart - Most ordered food items
2. Horizontal bar chart - Top 10 food items
3. Pie chart - Cuisine type distribution
4. Bar chart - Orders by restaurant
5. Bar chart - Average ratings by restaurant
6. Bar chart - Revenue by restaurant
7. Histogram - Order value distribution
8. Histogram - Delivery time distribution
9. Scatter plot - Distance vs delivery time
10. Horizontal bar chart - Delivery time by restaurant
11. Line chart - Peak ordering hours
12. Pie chart - Payment method distribution
13. Bar chart - Ratings distribution
14. Bar chart - Orders by day of week
15. Heatmap - Correlation matrix

## 🚀 How to Run the Project

### Prerequisites

Make sure you have Python installed with the required libraries:

```bash
pip install pandas numpy matplotlib seaborn jupyter
```

### Steps to Run

1. **Clone or download this project**

2. **Navigate to the project directory**
   ```bash
   cd Online-Food-Delivery-Analysis
   ```

3. **Launch Jupyter Notebook**
   ```bash
   jupyter notebook
   ```

4. **Open the notebook**
   - Click on `Online_Food_Delivery_Analysis.ipynb`

5. **Run all cells**
   - Click on `Cell` → `Run All`
   - Or press `Shift + Enter` to run cells one by one

### Alternative: Regenerate the Notebook

If you want to regenerate the notebook:

```bash
python generate_notebook.py
```

## 📊 Key Insights

### Customer Behavior
- **Peak Hours**: Evening hours (19:00-21:00) receive the highest orders
- **Payment Preference**: UPI is the most preferred payment method
- **Customer Satisfaction**: Average rating of 4.3+ indicates high satisfaction

### Delivery Performance
- **Average Delivery Time**: ~37 minutes
- **Distance Impact**: Strong correlation between distance and delivery time
- **Efficiency**: Orders under 4 KM delivered in under 30 minutes

### Revenue Trends
- **Average Order Value**: ₹350-400 per order
- **High-Value Items**: Biryani and Pizza generate higher revenue
- **Balanced Distribution**: Revenue fairly distributed among restaurants

### Restaurant Performance
- **Popular Cuisines**: Indian, Italian, Chinese, and Fast Food
- **Top Items**: Chicken Biryani, Pizzas, and Burgers
- **Quality Ratings**: All restaurants maintain ratings above 4.0

## 💡 Business Recommendations

1. Increase delivery personnel during peak hours (19:00-21:00)
2. Promote digital payment methods (UPI) with incentives
3. Ensure adequate inventory for top-selling items
4. Consider distance-based dynamic pricing
5. Maintain quality standards to keep high ratings
6. Create weekend promotions to boost orders
7. Implement customer loyalty programs

## 🎓 Learning Outcomes

This project helps you learn:

- ✅ Data loading and exploration with Pandas
- ✅ Data cleaning and preprocessing techniques
- ✅ Exploratory Data Analysis (EDA)
- ✅ Creating professional visualizations
- ✅ Statistical analysis and correlation
- ✅ Deriving business insights from data
- ✅ Presenting data analysis results

## 📝 Notes for Students

- **Simple and Beginner-Friendly**: All code is well-commented and easy to understand
- **No Machine Learning**: Focuses purely on data analysis and visualization
- **Professional Format**: Suitable for college submissions and presentations
- **Complete Project**: Includes all sections from introduction to conclusion
- **Business Insights**: Each analysis includes practical business insights

## 🎯 Suitable For

- College Python for Data Science projects
- Mini project demonstrations
- Viva presentations
- Data analysis assignments
- Portfolio projects
- Learning data visualization

## 📧 Support

If you encounter any issues:
1. Ensure all libraries are installed correctly
2. Check that the dataset file is in the `dataset/` folder
3. Verify Python version (3.6 or higher recommended)
4. Make sure Jupyter Notebook is properly installed

## 📄 License

This project is created for educational purposes and is free to use for college projects and learning.

---

**Happy Learning! 🎉**

*Created for Python Data Science Students*
