// This is a hack to have the import sorter respect that the .scss file gets imported first
// so that local css imports from components would not be ordered before the main import
import './app.scss'
