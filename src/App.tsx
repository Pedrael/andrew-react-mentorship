import './App.css';
import TodoList from './components/todo-list/TodoList';

function App() {
  return (
    <>
      <section id="center">
        <TodoList />
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;
