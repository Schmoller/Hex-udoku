import { MainLayout } from './layouts/MainLayout';
import { GameLoadingContainer } from './views/game/GameLoadingContainer';

function App() {
    return (
        <MainLayout>
            <GameLoadingContainer />
        </MainLayout>
    );
}

export default App;
